import React from 'react';

/**
 * Drop-in replacement for <input type="password">, with an eye button that
 * toggles the value between masked and plain text.
 *
 * Behaves like a plain <input>: accepts a ref (forwarded to the underlying
 * <input> DOM node, so it works with both controlled `value`/`onChange` and
 * uncontrolled ref-based usage), plus any other standard input props.
 *
 * Properties:
 *      className       - applied to the outer wrapper (e.g. grid sizing like "col-sm-8")
 *      inputClassName  - extra classes appended to the inner <input>
 *      tokenMode       - when true, masks via CSS text-security on a type="text"
 *                        input instead of type="password". Use this for API
 *                        tokens / access keys so the browser's password
 *                        manager never offers to save them.
 *      ...rest         - forwarded to the inner <input> (id, value, onChange, ref, etc.)
 */
export const CPasswordReveal = React.forwardRef(function CPasswordReveal(props, ref) {
  const { className, inputClassName, tokenMode, ...rest } = props;
  const [visible, setVisible] = React.useState(false);

  // The grid-sizing class (e.g. "col-sm-8") lives on this outer wrapper,
  // kept separate from "input-group" below — both classes set `width`, and
  // combining them on one element lets whichever wins the cascade override
  // the other, breaking alignment with sibling rows.
  return (
    <div className={className}>
      <div className="input-group">
        <input
          {...rest}
          ref={ref}
          type={tokenMode ? 'text' : (visible ? 'text' : 'password')}
          autoComplete={tokenMode ? 'off' : rest.autoComplete}
          style={tokenMode && !visible ? { WebkitTextSecurity: 'disc', textSecurity: 'disc' } : undefined}
          className={'form-control' + (inputClassName ? ' ' + inputClassName : '')}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          tabIndex={-1}
          onClick={(e) => {
            // Prevent the click from bubbling to Bootstrap's dropdown outside-click
            // handler, which would otherwise close the login dropdown this control
            // often lives in.
            e.preventDefault();
            e.stopPropagation();
            setVisible((v) => !v);
          }}
          aria-label={visible ? 'Hide value' : 'Show value'}
        >
          <i className={visible ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
        </button>
      </div>
    </div>
  );
});
