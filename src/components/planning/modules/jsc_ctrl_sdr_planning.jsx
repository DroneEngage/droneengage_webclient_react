import React from 'react';
import ClssModulePlanningBase from './jsc_ctrl_dynamic_base.jsx';

export class ClssSDR_Planning extends ClssModulePlanningBase {
  constructor(props) {
    super(props);
    this.moduleName = 'sdr';
  }

  fn_editShape() {
    // Call parent fn_editShape if needed
    super.fn_editShape();
    }

}
