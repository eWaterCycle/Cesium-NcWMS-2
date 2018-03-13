import angular from 'angular';
import ngAnimate from 'angular-animate';
import ngSanitize from 'angular-sanitize';
import ngTouch from 'angular-touch';
import toastr from 'angular-toastr';

import * as d3 from 'd3';
// import colorbrewer from 'colorbrewer';
// import dialogPolyfill from 'dialog-polyfill';

// import '../../node_modules/dc/dc.min.css';
// import '../../node_modules/material-design-lite/material.min.css';
// import '../../node_modules/angular-toastr/dist/angular-toastr.css';
// import '../../node_modules/dialog-polyfill/dialog-polyfill.css';
import '../../node_modules/cesium/Build/Cesium/Widgets/widgets.css';
import '../styles/main.css';

export default class EWaterCycleApp {
  constructor() {
    console.log('constructor loaded');
    //Tying it all together
    angular.module('eWaterCycleApp', [
      'ui.router',
      'ui.bootstrap',

      //Modules dependent on ncwms
      'eWaterCycleApp.ncwms',
      'eWaterCycleApp.palette',
      'eWaterCycleApp.dataset',

      //Modules dependent on wms
      //'eWaterCycleApp.wms',

      //Modules dependent on cesium
      'eWaterCycleApp.cesiumViewer',
      'eWaterCycleApp.viewmodel',
      'eWaterCycleApp.flyTo',
      'eWaterCycleApp.outlines',

      //Modules dependent on ncwms AND cesium
      'eWaterCycleApp.cesiumNcwmsLayer',

      //Modules dependent on wms AND cesium
      //'eWaterCycleApp.cesiumWmsLayer',

      //Modules dependent on d3
      //'eWaterCycleApp.bargraph',
      //'eWaterCycleApp.linegraph',
      'eWaterCycleApp.customgraph',

      //Standalone modules
      'eWaterCycleApp.logarithmic',
      'eWaterCycleApp.terrain',
      'eWaterCycleApp.biglegend',

      //Project logos etc.
      'eWaterCycleApp.logos',
      'eWaterCycleApp.projectlogo',

      'eWaterCycleApp.help',
      'eWaterCycleApp.helpModal'
    ]).run(function(NcwmsService) {
      NcwmsService.init();
      console.log('ncwms init done');
    });

    //Utility modules
    angular.module('eWaterCycleApp.templates', []);
    angular.module('eWaterCycleApp.utils', ['eWaterCycleApp.templates']);

    //Modules dependent on ncwms
    angular.module('eWaterCycleApp.ncwms', ['eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.palette', ['eWaterCycleApp.ncwms', 'eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.dataset', ['eWaterCycleApp.ncwms', 'eWaterCycleApp.utils']);

    //Modules dependent on wms
    //angular.module('eWaterCycleApp.wms', [ 'eWaterCycleApp.utils' ]);

    //Modules dependent on cesium
    angular.module('cesium', [])
      .factory('Cesium', function($window) {
        return $window.Cesium;
      });
    angular.module('eWaterCycleApp.cesiumViewer', ['cesium', 'eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.outlines', ['cesium', 'eWaterCycleApp.cesiumViewer', 'eWaterCycleApp.utils']);

    //Modules dependent on ncwms AND cesium
    angular.module('eWaterCycleApp.cesiumNcwmsLayer', ['cesium', 'eWaterCycleApp.cesiumViewer', 'eWaterCycleApp.ncwms', 'eWaterCycleApp.utils']);

    //Modules dependent on wms AND cesium
    //angular.module('eWaterCycleApp.cesiumWmsLayer', [ 'cesium', 'eWaterCycleApp.cesiumViewer', 'eWaterCycleApp.wms', 'eWaterCycleApp.utils' ]);

    //Modules dependent on d3
    angular.module('d3', [])
      .factory('d3Service', ['$document', '$window', '$q', '$rootScope',
        function($document, $window, $q, $rootScope) {
          var d = $q.defer(),
            d3service = {
              d3: function() {
                return d.promise;
              }
            };

          function onScriptLoad() {
            // Load client in the browser
            $rootScope.$apply(function() {
              d.resolve($window.d3);
            });
          }
          var scriptTag = $document[0].createElement('script');
          scriptTag.type = 'text/javascript';
          scriptTag.async = true;
          scriptTag.src = 'http://d3js.org/d3.v3.min.js';
          scriptTag.onreadystatechange = function() {
            if (this.readyState === 'complete') {
              onScriptLoad();
            }
          };
          scriptTag.onload = onScriptLoad;

          var s = $document[0].getElementsByTagName('body')[0];
          s.appendChild(scriptTag);

          return d3service;
        }
      ]);

    //angular.module('eWaterCycleApp.bargraph', ['d3', 'eWaterCycleApp.utils']);
    //angular.module('eWaterCycleApp.linegraph', ['d3', 'eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.customgraph', ['d3', 'eWaterCycleApp.ncwms', 'eWaterCycleApp.utils']);

    //Standalone modules
    angular.module('eWaterCycleApp.viewmodel', ['eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.flyTo', ['eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.logarithmic', ['eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.terrain', ['eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.biglegend', ['eWaterCycleApp.utils']);

    //Project logos etc.
    angular.module('eWaterCycleApp.logos', []);
    angular.module('eWaterCycleApp.projectlogo', []);

    angular.module('eWaterCycleApp.help', ['eWaterCycleApp.utils']);
    angular.module('eWaterCycleApp.helpModal', ['eWaterCycleApp.utils']);

    require('./util/decimaladjust.service.js');
    require('./util/messagebus.service.js');
    require('./util/userAgent.service.js');

    require('./ncwmsservice/ncwms.service.js');

    require('./cesiumviewer/cesium-viewer.service.js');
    require('./cesiumviewer/cesium-viewer.controller.js');
    require('./cesiumviewer/cesium-viewer.directive.js');

    require('./cesiumncwmslayer/cesium.ncwms.layer.controller.js');
    require('./cesiumncwmslayer/cesium.ncwms.layer.directive.js');

    require('./dataset/dataset.controller.js');
    require('./dataset/dataset.directive.js');

    require('./palette/palette.controller.js');
    require('./palette/palette.directive.js');
    require('./palette/palette.iamlegend.directive.js');

    require('./viewmodel/viewmodel.controller.js');
    require('./viewmodel/viewmodel.directive.js');

    require('./flyto/flyto.controller.js');
    require('./flyto/flyto.directive.js');

    require('./terrain/terrain.controller.js');
    require('./terrain/terrain.directive.js');

    require('./logarithmic/logarithmic.controller.js');
    require('./logarithmic/logarithmic.directive.js');

    require('./outlines/outlines.controller.js');
    require('./outlines/outlines.directive.js');

    require('./biglegend/biglegend.controller.js');
    require('./biglegend/biglegend.directive.js');

    require('./logos/logos.directive.js');
    require('./projectlogo/projectlogo.directive.js');

    require('./customgraph/customgraph.directive.js');
    require('./customgraph/customgraph.controller.js');

    require('./help/help.directive.js');
    require('./help/help.controller.js');

    require('./helpModal/helpModal.directive.js');
    require('./helpModal/helpModal.controller.js');
  }
}
