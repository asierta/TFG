app.controller('mainController', function ($scope, $rootScope, $mdDialog, $mdMedia, $mdToast, $timeout) {
  $scope.sesionIniciada = null;
  firebase.auth().onAuthStateChanged(function (user) {
    $scope.sesionIniciada = !!user;
    if (!user){
      document.cookie = "grupo=;";
      document.cookie = " clave=;";
      document.cookie = " username=;";
      // $mdToast.show($mdToast.simple()
      //   .content("Inicia sesión para poder acceder")
      //   .position('bottom right')
      //   .hideDelay(3000));
      $scope.error = "Inicie sesión para acceder";
    }
    $scope.username = getCookie('username');
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
          let clave = CryptoJS.MD5(credentials.clave);
          firebase.database().ref('gruposUsuarios/').child(credentials.grupo).once('value', function (grupoHijo) {
            let childData = grupoHijo.val();
            if (childData.clave === undefined) {
              firebase.database().ref('gruposUsuarios/').child(grupoHijo.key).child('clave').set(CryptoJS.SHA256(credentials.clave).toString(CryptoJS.enc.Hex));
            } else if (childData.clave !== CryptoJS.SHA256(credentials.clave).toString(CryptoJS.enc.Hex)) {
              firebase.auth().signOut();
              return showToast("Clave de cifrado incorrecta");
            }
            document.cookie = "grupo=" + credentials.grupo + ";";
            document.cookie = "clave=" + clave + ";";
            document.cookie = "username=" + credentials.username + ";";
            $scope.username = credentials.username;
            $scope.error = "";

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
      document.cookie = " username=;";
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
    for (let i = 0; i < ca.length; i++) {
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
        '                  <div ng-message="required">Es obligatorio introducir el correo electrónico</div>\n' +
        '                  <div ng-message="email">Introduce una dirección de correo válida</div>\n' +
        '                </div>\n' +
        '              </md-input-container>\n' +
        '              <div id="error-submit-password" style="color:red"></div>\n' +
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
          firebase.auth().sendPasswordResetEmail($scope.email).then(function () {
            // Email sent.
            showToast("Correo de restauración de contraseña enviado");
            $scope.close();
          }).catch(function (error) {
            // An error happened.
            var element = angular.element(document.querySelector('#error-submit-password'));
            element.text("Hubo un problema al enviar el correo de restauración");
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
      let usuarioExiste = false;
      let grupo = "";
      try {
        firebase.database().ref('gruposUsuarios/').once('value', function (grupo) {
          grupo.forEach(function (grupoHijo) {
            let childData = grupoHijo.val();
            if (childData[username.split(".").join("-")] === true) {
              usuarioExiste = true;
              grupo = grupoHijo.key;
              if (childData.clave !== undefined && childData.clave !== CryptoJS.SHA256(clave).toString(CryptoJS.enc.Hex)) {
                var element = angular.element(document.querySelector('#error-submit'));
                element.text("Clave de cifrado incorrecta");
              } else {
                firebase.auth().signInWithEmailAndPassword(username, password).then(function () {
                  $mdDialog.hide({username: username, password: password, clave: clave.toString(), grupo: grupo});
                }).catch(function(error) {
                  var element = angular.element(document.querySelector('#error-submit'));
                  element.text("Usuario y/o contraseña incorrectos");
                });
              }
            }
          });
          if (!usuarioExiste) {
            var element = angular.element(document.querySelector('#error-submit'));
            element.text("El usuario introducido no existe");
          }
        });
      } catch (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        var element = angular.element(document.querySelector('#error-submit'));
        element.text(errorMessage);
        showToast(errorMessage);
      }
    };
  }

});


