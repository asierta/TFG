let app = angular.module('MyApp', ['ngMaterial', 'ngMessages', 'ngRoute', 'material.svgAssetsCache', 'md.data.table', 'ngAnimate']);

// Configuración de las rutas
app.config(function($routeProvider) {

  $routeProvider
    .when('/', {
      templateUrl	: 'views/home.html',
      controller 	: 'mainController',
    })
    .when('/login', {
      templateUrl : 'login-template.html',
      controller 	: 'LoginController',
    })
    .when('/pacientes', {
      templateUrl : 'views/pacientes.html',
      controller 	: 'PacienteController'
    })
    .when('/grabaciones/:paciente', {
      templateUrl : 'views/grabaciones.html',
      controller 	: 'GrabacionController'
    })
    .otherwise({
      redirectTo: '/'
    });
});
