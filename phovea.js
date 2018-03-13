/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function (registry) {
  // generator-phovea:begin
  registry.push('app', 'brainvis', null, {
    'name': 'BRAINVIS Demo'
  });

  registry.push('actionFactory', 'brainvis', function () {
    return System.import('./src/cmds');
  }, {
    'factory': 'createCmd',
    'creates': '(setControlOrientation|setControlZoom|setSliceZoom|setSliceOrientation|setSliceVisibility|setSliceHandleVisibility|setSliceMode|setObjectsVisibility|setSelection)'
  });

  registry.push('actionCompressor', 'setControlZoom', function () {
    return System.import('./src/cmds');
  }, {
    'factory': 'compressSetControlZoom',
    'matches': 'setControlZoom'
  });

  registry.push('actionCompressor', 'setControlOrientation', function () {
    return System.import('./src/cmds');
  }, {
    'factory': 'compressSetControlOrientation',
    'matches': 'setControlOrientation'
  });
  // generator-phovea:end
};
