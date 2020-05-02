// this is an example of improting data from JSON
//import 'orders' from '../data/orders.json';

export default (function () {
    class Repository {
        constructor() {
            
        }

        async collections(){
            let companies = await this._getCompanies();
            let users = await this._getUsers();
            let orders = await this._getOrders();
            let data = {};

            data.companies = companies;
            data.users = users;
            data.orders = orders;
            
            return data;
        }

        _getOrders() {
            // запрашиваем JSON о заказах
            return this._request('orders');
        }

        _getUsers(){
            // запрашиваем JSON о пользователях
            return this._request('users');
        }

        _getCompanies(){
            // запрашиваем JSON о компаниях
            return this._request('companies');
        }

        _request(type){
            return fetch('/api/'+type+'.json').then(response => response.json());
        }

    }

    class App {
		constructor() {
			this.data = [];
			this.sortAsc = 0;
		}

		/**
		 * Инициализация
		 */
		init() {
			console.log("init");
			let self = this;
			this.getData().then((collections) => {
				let items = [];

				collections.orders.forEach((orderElement) => {
					let user = {};

					collections.users.forEach((userElement) => {
						if (userElement.id == orderElement.user_id) {
							user = userElement;
						}
					});

					let company = {};

					collections.companies.forEach((companyElement) => {
						if (companyElement.id == user.company_id) {
							company = companyElement;
						}
					});

					orderElement.userInfo = user;
					orderElement.companyInfo = company;

					items.push(orderElement);
				});

				self.data = items;
				self.render();
			});
		}

		/**
		 * Формирование данных
		 */
		async getData() {
			let repository = new Repository();
			let collections = await repository.collections();

			return collections;
		}

		/**
		 * Отрисовка таблицы
		 */
		render() {
			let self = this;

			let title = document.createElement("h2");
			title.textContent = "Orders";
			document.getElementById("app").appendChild(title);

			let table = document.createElement("table");
			table.classList = "table table-striped";
			table.id = "orderList";

			let thead = document.createElement("thead");
			let theadTr = document.createElement("tr");

			let listCols = [
				"Transaction ID",
				"User Info",
				"Order Date",
				"Order Amount",
				"Card Number",
				"Card Type",
				"Location",
			];

			let iteration = 0;
			listCols.forEach((cols) => {
				let th = document.createElement("th");
				th.textContent = cols;
				th.setAttribute("scope", "col");
				let i = iteration;
				th.addEventListener("click", function (e) {
					self.sort_table(document.getElementById("orderList"), i);

					e.preventDefault();
				});

				iteration++;

				theadTr.appendChild(th);
			});

			thead.appendChild(theadTr);
			table.appendChild(thead);

			let tbody = document.createElement("tbody");
			this.data.forEach((order) => {
				let tr = document.createElement("tr");
				tr.setAttribute("id", "order_" + order.id);

				let colId = document.createElement("td");
				colId.textContent = order.transaction_id;
				tr.appendChild(colId);

				let genderPrefix = "";
				if (order.userInfo.gender == "Male") {
					genderPrefix = "Mr. ";
				} else if (order.userInfo.gender == "Female") {
					genderPrefix = "Ms. ";
				}
				let colUserData = document.createElement("td");
				colUserData.classList = "user-data";

				let colUserDataLink = document.createElement("a");
				colUserDataLink.href = "/api/";
				colUserDataLink.addEventListener("click", function (e) {
					let container = this.closest("td");
					let userDeatilContainer = container.querySelector("div");
					if (userDeatilContainer.className.indexOf("d-none") > -1) {
						userDeatilContainer.classList = "";
					} else {
						userDeatilContainer.classList = "d-none";
					}

					e.preventDefault();
				});

				colUserDataLink.textContent =
					genderPrefix +
					order.userInfo.first_name +
					" " +
					order.userInfo.last_name;
				colUserData.appendChild(colUserDataLink);

				let colUserDataDetail = this.containerUserDetail(order);
				colUserData.appendChild(colUserDataDetail);

				tr.appendChild(colUserData);

				let colDate = document.createElement("td");
				colDate.textContent = this.dateFormat(order.created_at, "full");
				tr.appendChild(colDate);

				let colPrice = document.createElement("td");
				colPrice.textContent = order.total;
				tr.appendChild(colPrice);

				let colCard = document.createElement("td");
				colCard.textContent = this.cardFormat(order.card_number);
				tr.appendChild(colCard);

				let colCardType = document.createElement("td");
				colCardType.textContent = order.card_type;
				tr.appendChild(colCardType);

				let colCountry = document.createElement("td");
				colCountry.textContent =
					order.order_country + "(" + order.order_ip + ")";
				tr.appendChild(colCountry);

				tbody.appendChild(tr);
			});

			table.appendChild(tbody);

			document.getElementById("app").appendChild(table);
		}

		/**
		 * Сортировка по колонкам
		 *
		 * @param {element} table
		 * @param {number} col
		 */
		sort_table(table, col) {
			let self = this;
			if (this.sortAsc == 2) {
				this.sortAsc = -1;
			} else {
				this.sortAsc = 2;
			}
			var rows = table.tBodies[0].rows;
			var rlen = rows.length - 1;
			var arr = new Array();
			var i, j, cells, clen;

			// все значения таблицы
			for (i = 0; i < rlen; i++) {
				cells = rows[i].cells;
				clen = cells.length;
				arr[i] = new Array();
				for (j = 0; j < clen; j++) {
					arr[i][j] = cells[j].innerHTML;
				}
			}

			// сорттировка по колонкам с убыванием-возростаниев
			arr.sort(function (a, b) {
				var retval = 0;
				var col1 = a[col]
					.toLowerCase()
					.replace(",", "")
					.replace("$", "")
					.replace(" usd", "");
				var col2 = b[col]
					.toLowerCase()
					.replace(",", "")
					.replace("$", "")
					.replace(" usd", "");
				var fA = parseFloat(col1);
				var fB = parseFloat(col2);
				if (col1 != col2) {
					if (fA == col1 && fB == col2) {
						retval = fA > fB ? self.sortAsc : -1 * self.sortAsc;
					} // числа
					else {
						retval = col1 > col2 ? self.sortAsc : -1 * self.sortAsc;
					}
				}
				return retval;
			});

			// новый порядок сортировки
			for (var rowidx = 0; rowidx < rlen; rowidx++) {
				for (var colidx = 0; colidx < arr[rowidx].length; colidx++) {
					table.tBodies[0].rows[rowidx].cells[colidx].innerHTML =
						arr[rowidx][colidx];
				}
            }
            
            for (i = 0; i < rlen; i++) {
				let hdrClear = table.rows[0].cells[i];

				if (typeof hdrClear != "undefined") {
					if (hdrClear.querySelector("span")) {
						hdrClear.querySelector("span").remove();
					}

					hdrClear.innerHTML = hdrClear.innerHTML;
				}
			}

            let hdr = table.rows[0].cells[col];
            
            if(hdr.querySelector('span')){
                hdr.querySelector('span').remove();
            }
			if (this.sortAsc == -1) {
				hdr.innerHTML = (hdr.innerHTML + '<span>&#8593;</span>');
			} else {
                hdr.innerHTML = (hdr.innerHTML + '<span>&#8595;</span>');
			}
		}

		/**
		 * Вывод даты в определенном формате
		 *
		 * @param {integer} stamp
		 * @param {string} format
		 */
		dateFormat(stamp, format) {
			var newDate = new Date();
			let str = "";

			if (parseInt(stamp) == 0) {
				return str;
			}

			newDate.setTime(parseInt(stamp) * 1000);

			if (format == "full") {
				let dd = ("0" + newDate.getDate()).slice(-2);
				let mm = ("0" + (newDate.getMonth() + 1)).slice(-2);
				let yyyy = newDate.getFullYear();

				str =
					yyyy +
					"/" +
					mm +
					"/" +
					dd +
					" " +
					newDate.getHours() +
					":" +
					newDate.getMinutes() +
					":" +
					newDate.getSeconds();
			} else if (format == "short") {
				let dd = ("0" + newDate.getDate()).slice(-2);
				let mm = ("0" + (newDate.getMonth() + 1)).slice(-2);
				let yyyy = newDate.getFullYear();

				str = dd + "/" + mm + "/" + yyyy;
			}

			return str;
		}

		/**
		 * Вывод номера карты в безопасном режиме
		 *
		 * @param {string} cardNumber
		 */
		cardFormat(cardNumber) {
			let result = "";
			for (let i = 0; i < cardNumber.length; i++) {
				if (i >= 2 && i < 10) {
					result += "*";
				} else {
					result += cardNumber[i];
				}
			}

			return result;
		}

		/**
		 * Доп.информация по клиенту
		 *
		 * @param {array} order
		 */
		containerUserDetail(order) {
			let colUserDataDetail = document.createElement("div");
			colUserDataDetail.classList = "d-none";

			if (order.userInfo.birthday) {
				let colUserDataDetailBirthday = document.createElement("p");
				colUserDataDetailBirthday.textContent = this.dateFormat(
					order.userInfo.birthday,
					"short"
				);
				colUserDataDetail.appendChild(colUserDataDetailBirthday);
			}

			if (order.userInfo.avatar) {
				let colUserDataDetailAvatarBlock = document.createElement("p");

				let colUserDataDetailAvatar = document.createElement("img");
				colUserDataDetailAvatar.src = order.userInfo.avatar;
				colUserDataDetailAvatar.style.width = "100px";
				colUserDataDetailAvatarBlock.appendChild(
					colUserDataDetailAvatar
				);

				colUserDataDetail.appendChild(colUserDataDetailAvatarBlock);
			}

			if (order.companyInfo.id) {
				let colUserDataDetailCompany = document.createElement("p");
				colUserDataDetailCompany.innerHTML =
					'Company: <a href="' +
					order.companyInfo.url +
					'" target="_blank">' +
					order.companyInfo.title +
					"</a>";
				colUserDataDetail.appendChild(colUserDataDetailCompany);
			}

			if (order.companyInfo.industry) {
				let colUserDataDetailIndustry = document.createElement("p");
				colUserDataDetailIndustry.textContent =
					"Industry: " + order.companyInfo.industry;
				colUserDataDetail.appendChild(colUserDataDetailIndustry);
			}
			return colUserDataDetail;
		}
	}

    const app = new App();
    app.init();
}());
