import React    from 'react';

export class CFieldChecked extends React.Component {
    
    
    constructor()
    {
        super ();
        this.state = {
            m_messages:{}
        };
    }

    componentDidMount()
    {
        var n = '#'+this.props.itemid ;
        //var me = this;    
        $(n + ' :checkbox').change(function() {

            // this will contain a reference to the checkbox   
            fn_console_log ("HELP");
            if (this.checked) {
                this.props = true;
                $(n + " :text").removeAttr('disabled', true);
            } else {
                this.props = false;
                $(n + " :text").attr('disabled', 'disabled');
            }
        });

        if ((this.props.required === false) || (this.props.required == 'false'))
        {
            $(n + " :text").attr('disabled', 'disabled');
        }
        else
        {
            $(n + " :text").removeAttr('disabled', true);
        }

        $('#' + this.props.itemid + " :text").val(this.props.txtValue);
    }

    componentDidUpdate() 
    {
        var n = '#txt'+ this.props.itemid ;
        
        if ((this.props.required == false) || (this.props.required == 'false'))
        {
            $(n + " :text").attr('disabled', 'disabled');
            $(n + " :checkbox").prop('checked', false);
        }
        else
        {
            $(n + " :text").removeAttr('disabled', true);
            $(n + " :checkbox").prop('checked', true);
        }
    }

    fn_getValue ()
    {
        if ($('#chk' + this.props.itemid ).prop('checked') == false)
        {
            return null;
        }
        
        
        return $('#txt' + this.props.itemid).val();
    }

    render ()
    {

        return (
            <div id={this.props.itemid} className="input-group input-group-sm">
                    <label id={'lbl' + this.props.itemid}  htmlFor={'txt' + this.props.itemid} className="form-check-input css_label_waypoint me-2 bg-transparent text-white " >{this.props.txtLabel}</label>
                    <input id={'txt' + this.props.itemid}  className="form-control input-sm me-5 " type='text' />
                    <input id={'chk' + this.props.itemid}  className="form-check-input ms-2" type="checkbox" />
            </div>
        );
    }

}