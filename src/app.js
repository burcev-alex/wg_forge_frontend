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
        }

        /**
         * Инициализация
         */
        init() {
            console.log('init');
            let self = this;
            this.getData().then((collections) => {
                let items = [];

                collections.orders.forEach(orderElement => {
                    let user = {}

                    collections.users.forEach(userElement => {
                        if(userElement.id == orderElement.user_id){
                            user = userElement;
                        }
                    });

                    let company = {}

                    collections.companies.forEach(companyElement => {
                        if(companyElement.id == user.company_id){
                            company = companyElement;
                        }
                    });

                    orderElement.userInfo = user;
                    orderElement.companyInfo = company;
                    
                    items.push(orderElement);
                    
                });
                
                self.data = items;
                self.createTable();
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
        createTable(){
            console.log(this.data);
            document.getElementById("app").innerHTML = "<h1>Заказы</h1>";
        }
    }

    const app = new App();
    app.init();
}());
