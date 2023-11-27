export  class CLSS_RX_MESSAGE  extends React.Component {

    constructor(props)
    {
        super(props);
        this.state={
            m_message: [],
		    'm_update': 0
        };
        window.AndruavLibs.EventEmitter.fn_subscribe (EE_unitUpdated,this,this.fn_unitUpdated);
    }

    componentWillUnmount () {
        window.AndruavLibs.EventEmitter.fn_unsubscribe (EE_unitUpdated,this);
    }
    componentDidMount () 
    {
        this.state.m_update = 1;
    }

    fn_unitUpdated (p_me,p_andruavUnit)
    {
        if (p_me.props.p_unit.partyID != p_andruavUnit.partyID) return ;
        if (p_me.state.m_update == 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }
    

    render () {

        var msg = [];

        const msg_in = this.props.p_unit.m_Messages.m_messages_in;
        const msg_in_mavlink = this.props.p_unit.m_Messages.m_messages_in_mavlink;

        Object.keys(msg_in).forEach(key => {
            if (message_names[key]==null)
            {
                message_names[key] = key;
            }
            msg.push(
                <tr>
                    <td>
                        <small>{message_names[key]}</small>
                    </td>
                    <td>
                        <small>{msg_in[key]}</small>
                    </td>
                </tr>);
          });

          Object.keys(msg_in_mavlink).forEach(key => {
            if (message_names[key]==null)
            {
                message_names[key] = key;
            }
            msg.push(
                <tr>
                    <td className="text-success">
                        <small>{message_names[key]}</small>
                    </td>
                    <td>
                        <small>{msg_in_mavlink[key]}</small>
                    </td>
                </tr>);
          });

        return  (<div key={'CLSS_RX_MESSAGE' + this.props.p_unit.partyID } className="">
            <table className = "table table-dark table-striped">
                <thead>
                    <tr>
                        <th scope="col">msg_id</th>
                        <th scope="col">Number</th>
                    </tr>
                </thead>
                <tbody>
                    {msg}
                </tbody>
            </table>
       </div>);
    }

}
