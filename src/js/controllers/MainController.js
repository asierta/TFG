app.controller('mainController', function($scope, $mdDialog, $mdMedia, $mdToast) {
  $scope.status = '';
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.showDialog = function (event) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
      controller: LoginDialogController,
      controllerAs: 'dialog',
      templateUrl: 'login-dialog.template.html',
      parent: angular.element(document.body),
      targetEvent: event,
      clickOutsideToClose: true,
      fullscreen: useFullScreen
    })
      .then(function (credentials) {
          return showToast("Bienvenido " + credentials.username + ".");
        },
        function () {
          return showToast('Has cancelado el inicio de sesión.');
      });
    $scope.$watch(function () { return $mdMedia('xs') || $mdMedia('sm'); }, function (wantsFullScreen) { return $scope.customFullscreen = wantsFullScreen === true; });
  };

  $scope.cerrarSesion = function(){
    firebase.auth().signOut().then(function() {
      showToast("Sesión finalizada correctamente");
    }).catch(function(error) {
      showToast(error.message);
    });
  };
  showToast = function (content) {
    $mdToast.show($mdToast.simple()
      .content(content)
      .position('top right')
      .hideDelay(3000));
  };

  function LoginDialogController($scope, $mdDialog) {
    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.close = function() {
      $mdDialog.cancel();
    };

    $scope.login = function() {
      var username = this.username;
      var password = this.password;
      firebase.auth().signInWithEmailAndPassword(this.username, this.password).then(function(){
        console.log("Sesión iniciada correctamente");
        $mdDialog.hide({ username: username, password: password });
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + errorMessage);
        var element = angular.element(document.querySelector( '#error-submit' ));
        element.text(errorMessage);
        showToast(errorMessage);
      });

    };
  }

});


