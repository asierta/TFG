var app = angular.module('MyApp', ['ngMaterial', 'ngMessages', 'ngRoute', 'material.svgAssetsCache']);

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
    .when('/importar', {
      templateUrl : 'views/importarDatos.html',
      controller 	: 'importarDatosController'
    })
    .otherwise({
      redirectTo: '/'
    });
});


