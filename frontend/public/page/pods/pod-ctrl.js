angular.module('app')
.controller('PodCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.loadError = false;

  k8s.pods.get($routeParams.name, $scope.ns)
    .then(function(pod) {
      $scope.pod = pod;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.pod = null;
      $scope.loadError = true;
    });

  $scope.getStatus = function(containerName) {
    return k8s.docker.getStatus($scope.pod, containerName);
  };

  $scope.getContainerState = function(containerName) {
    var cinfo = k8s.docker.getStatus($scope.pod, containerName);
    return k8s.docker.getState(cinfo);
  };

  $scope.getRestartPolicyLabel = k8s.pods.getRestartPolicyLabelById;

});
