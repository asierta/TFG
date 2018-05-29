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
    .when('/importar', {
      templateUrl : 'views/importarDatos.html',
      controller 	: 'importarDatosController'
    })
    .when('/pacientes', {
      templateUrl : 'views/pacientes.html',
      controller 	: 'PacienteController'
    })
    .when('/crearPaciente', {
      templateUrl : 'views/crearPaciente.html',
      controller 	: 'CrearPacienteController'
    })
    .when('/borrarPaciente', {
      templateUrl : 'views/borrarPaciente.html',
      controller 	: 'BorrarPacienteController'
    })
    .when('/grabaciones/:paciente', {
      templateUrl : 'views/grabaciones.html',
      controller 	: 'GrabacionController'
    })
    .when('/crearGrabacion', {
      templateUrl : 'views/crearGrabacion.html',
      controller 	: 'CrearGrabacionController'
    })
    .when('/borrarGrabacion', {
      templateUrl : 'views/borrarGrabacion.html',
      controller 	: 'BorrarGrabacionController'
    })
    .otherwise({
      redirectTo: '/'
    });
});
