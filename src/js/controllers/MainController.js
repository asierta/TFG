app.controller('mainController', function ($scope, $rootScope, $mdDialog, $mdMedia, $mdToast, $timeout) {
  $scope.sesionIniciada = null;
  firebase.auth().onAuthStateChanged(function (user) {
    $scope.sesionIniciada = !!user;
    // if ( user && (getCookie('clave') === "" || getCookie('grupo') === "")) {
    //   firebase.auth().signOut().then(function () {
    //   }).catch(function (error) {
    //     console.log(error.message);
    //   });
    // }
    $scope.$apply();
  });

  $scope.status = '';
  $rootScope.key = '';
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
        $scope.sesionIniciada = true;
          firebase.database().ref('gruposUsuarios/').once('value', function (grupo) {
            grupo.forEach(function (grupoHijo) {
              let childData = grupoHijo.val();
              if (childData[credentials.username.replace(".", "-")] === true) {
                console.log(credentials.clave);
                document.cookie = "grupo=" + grupoHijo.key + ";";
                document.cookie = "clave=" + credentials.clave + ";";
              }
            });
          });
          return showToast("Bienvenido " + credentials.username + ".");
        },
        function () {
          return showToast('Has cancelado el inicio de sesión.');
        });
    $scope.$watch(function () {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function (wantsFullScreen) {
      return $scope.customFullscreen = wantsFullScreen === true;
    });
  };

  $scope.cerrarSesion = function () {
    firebase.auth().signOut().then(function () {
      showToast("Sesión finalizada correctamente");
      document.cookie = "grupo=;";
      document.cookie = " clave=;";
    }).catch(function (error) {
      showToast(error.message);
    });
  };

  function showToast(content) {
    $mdToast.show($mdToast.simple()
      .content(content)
      .position('bottom right')
      .hideDelay(3000));
  }

  function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  function LoginDialogController($scope, $mdDialog, $timeout) {

    $timeout(function () {

      var restaurar = document.getElementById("restaurarPassword");

      restaurar.addEventListener("mouseover", function () {
        $(this).css('cursor', 'pointer');
      });

      restaurar.addEventListener("mouseout", function () {
        $(this).css('cursor', 'auto');
      });

    });
    $scope.hide = function () {
      $mdDialog.hide();
    };

    $scope.close = function () {
      $mdDialog.cancel();
    };

    $scope.restaurarPassword = function (event, paciente) {
      event.stopPropagation(); // in case autoselect is enabled
      $mdDialog.show({
        targetEvent: event,
        controller: restaurarPasswordController,
        multiple: true,
        template: ' <md-dialog aria-label="Restaurar">\n' +
        '        <form id="passwordForm" name="passwordForm" ng-submit="restaurar()">\n' +
        '          <md-toolbar>\n' +
        '            <div class="md-toolbar-tools">\n' +
        '              <h2>Restaurar contraseña</h2>\n' +
        '              <span flex></span>\n' +
        '              <md-button class="md-icon-button" ng-click="close()">\n' +
        '                <md-icon md-svg-src="img/icons/ic_close_24px.svg" aria-label="Close dialog"></md-icon>\n' +
        '              </md-button>\n' +
        '            </div>\n' +
        '          </md-toolbar>\n' +
        '          <md-dialog-content>\n' +
        '            <div class="md-dialog-content" style="min-width: 350px; max-width: 80%; max-height: 60%;">\n' +
        '              <md-input-container class="md-block">\n' +
        '                <label>Usuario</label>\n' +
        '                <input name="username" ng-model="email" type="email" md-autofocus required title="email"\n' +
        '                       autocomplete="username"/>\n' +
        '                <div ng-messages="passwordForm.username.$error" ng-show="passwordForm.username.$touched">\n' +
        '                  <div ng-message="required">El usuario es obligatorio</div>\n' +
        '                  <div ng-message="email">Introduce una dirección de correo válida</div>\n' +
        '                </div>\n' +
        '              </md-input-container>\n' +
        '              <div id="error-submit" style="color:red"></div>\n' +
        '            </div>\n' +
        '          </md-dialog-content>\n' +
        '          <md-dialog-actions layout="row">\n' +
        '            <md-button type="submit" ng-disabled="passwordForm.$invalid" class="md-raised md-primary">Restaurar</md-button>\n' +
        '          </md-dialog-actions>\n' +
        '        </form>\n' +
        '      </md-dialog>',
      });

      function restaurarPasswordController($scope, $mdEditDialog, $element) {
        $scope.email = '';

        $scope.restaurar = function () {
          firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
            // Email sent.
            showToast("Correo de restauración de contraseña enviado");
            $scope.close();
          }).catch(function(error) {
            // An error happened.
            showToast("Hubo un problema al enviar el correo de restauración");
          });
        };

        $scope.close = function () {
          $mdDialog.hide();
        };

        function showToast(content) {
          $mdToast.show($mdToast.simple()
            .content(content)
            .position('bottom right')
            .hideDelay(3500));
        }
      }
    };


    $scope.login = function () {
      var username = this.username;
      var password = this.password;
      var clave = this.clave;
      clave = CryptoJS.MD5(this.clave);
      firebase.auth().signInWithEmailAndPassword(this.username, this.password).then(function () {
        console.log("Sesión iniciada correctamente");
        $mdDialog.hide({username: username, password: password, clave: clave.toString()});
      }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + errorMessage);
        var element = angular.element(document.querySelector('#error-submit'));
        element.text(errorMessage);
        showToast(errorMessage);
      });

    };
  }

});


