let app = angular.module('MyApp', ['ngMaterial', 'ngMessages', 'ngRoute', 'material.svgAssetsCache' ]);

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
    .when('/crearPaciente', {
      templateUrl : 'views/crearPaciente.html',
      controller 	: 'CrearPacienteController'
    })
    .when('/borrarPaciente', {
      templateUrl : 'views/borrarPaciente.html',
      controller 	: 'BorrarPacienteController'
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


