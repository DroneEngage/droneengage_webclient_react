import React from 'react';
import { withTranslation } from 'react-i18next';

import ClssMapSettings from './ClssMapSettings.jsx';
import ClssAdsbSettings from './ClssAdsbSettings.jsx';

/**
 * Parent settings tab that groups the Map and ADSB settings under a
 * single top-level tab. Each child lives in its own nested sub-tab so
 * the existing ClssMapSettings / ClssAdsbSettings components can be
 * reused unchanged.
 *
 * The nested nav uses unique ids (settings_map_sub / settings_adsb_sub)
 * and a dedicated tab-content container so Bootstrap's tab plugin does
 * not collide with the outer tab-content in ClssGlobalSettings.
 */
class ClssMapAdsbSettings extends React.Component {
  constructor() {
    super();
    this.defaultSubTabRef = React.createRef();
  }

  componentDidMount() {
    if (this.defaultSubTabRef.current) {
      this.defaultSubTabRef.current.classList.add('active');
    }
  }

  render() {
    const { t } = this.props;
    const dir = this.props.i18n.language === 'ar' ? 'rtl' : 'ltr';

    return (
      <div dir={dir}>
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <a
              className="nav-link user-select-none txt-theme-aware"
              data-bs-toggle="tab"
              href="#settings_map_sub"
              ref={this.defaultSubTabRef}
            >
              Map
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link user-select-none txt-theme-aware"
              data-bs-toggle="tab"
              href="#settings_adsb_sub"
            >
              ADSB
            </a>
          </li>
        </ul>
        <div className="tab-content pt-2">
          <div className="tab-pane fade active show" id="settings_map_sub">
            <ClssMapSettings t={t} i18n={this.props.i18n} />
          </div>
          <div className="tab-pane fade" id="settings_adsb_sub">
            <ClssAdsbSettings t={t} i18n={this.props.i18n} />
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation(['', 'globalSettings'])(ClssMapAdsbSettings);
