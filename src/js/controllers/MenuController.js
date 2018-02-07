app.controller('MenuCtrl', function ($scope, $timeout, $mdSidenav, $location) {
  $scope.toggleLeft = buildToggler('left');
  $scope.toggleRight = buildToggler('right');
  $scope.redirect = function(direction){
    $location.path("/"+direction);
    $mdSidenav('left').toggle(120);
  };

  function buildToggler(componentId) {
    return function() {
      $mdSidenav(componentId).toggle();
    };
  }
});
