var app = angular.module('MyApp', ['ngMaterial', 'ngMessages', 'ngRoute']);

// Configuración de las rutas
app.config(function($routeProvider) {

  $routeProvider
    .when('/', {
      templateUrl	: 'views/home.html',
      controller 	: 'mainController'
    })
    .when('/login', {
      templateUrl : 'views/login.html',
      controller 	: 'LoginController'
    })
    .when('/contacto', {
      templateUrl : 'views/contacto.html',
      controller 	: 'contactController'
    })
    .otherwise({
      redirectTo: '/'
    });
});
