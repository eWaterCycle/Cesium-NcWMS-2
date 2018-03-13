/**
 * Created by Samuel Gratzl on 27.08.2015.
 */

import * as template from './clue_overrides/template';
import 'file-loader?name=index.html!extract-loader!html-loader!./index.html';
import 'file-loader?name=404.html!./404.html';
import 'file-loader?name=robots.txt!./robots.txt';
import 'phovea_ui/src/_bootstrap';
import './style.scss';

import * as cmode from './clue_overrides/mode';
import * as C from 'phovea_core/src/index';

import * as ewatercycleView from './ewatercycleView';

const elems = template.create(document.body, {
  app: 'EWATERCYCLE',
  application: '/eWaterCycle',
  id: 'eWaterCycle'
});

elems.graph.then((graph) => {
  const app = ewatercycleView.create(<Element>elems.$main.node(), graph, function() {
    app.on('wait', elems.header.wait.bind(elems.header));
    app.on('ready', elems.header.ready.bind(elems.header));

    function updateBounds() {
      const bounds = C.bounds(document.querySelector('main'));
      app.setBounds(bounds.x, bounds.y, bounds.w - 200, bounds.h - 80);
    }

    elems.on('modeChanged', function (event, newMode) {
      app.setInteractive(newMode.exploration >= 0.8);
      //for the animations to end
      setTimeout(updateBounds, 300);
    });

    window.addEventListener('resize', updateBounds);
    setTimeout(updateBounds, 500);

    app.setInteractive(cmode.getMode().exploration >= 0.8);

    elems.jumpToStored();
  });
});

