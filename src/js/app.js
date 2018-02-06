var app = angular.module('MyApp', ['ngMaterial', 'ngMessages', 'ngRoute']);

// Configuración de las rutas
app.config(function($routeProvider) {

  $routeProvider
    .when('/', {
      templateUrl	: 'views/home.html',
      controller 	: 'mainController'
    })
    .when('/acerca', {
      templateUrl : 'pages/acerca.html',
      controller 	: 'aboutController'
    })
    .when('/contacto', {
      templateUrl : 'pages/contacto.html',
      controller 	: 'contactController'
    })
    .otherwise({
      redirectTo: '/'
    });
});
