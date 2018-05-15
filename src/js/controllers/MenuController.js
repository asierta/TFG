app.controller('MenuCtrl', function ($scope, $timeout, $mdSidenav, $location) {
  firebase.auth().onAuthStateChanged(function(user) {
    $scope.sesionIniciada = !!user;
  });
  $scope.toggleLeft = buildToggler('left');
  $scope.toggleRight = buildToggler('right');
  $scope.redirect = function(direction){
    $mdSidenav('left').toggle(120);
    $location.path("/"+direction);
  };

  function buildToggler(componentId) {
    return function() {
      $mdSidenav(componentId).toggle();
    };
  }
});
