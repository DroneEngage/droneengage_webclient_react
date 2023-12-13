class CLSS_FooterControl extends React.Component {
	constructor()
	{
        super ();
		this.state = {};
    }


    render()
    {
        const year = (new Date()).getFullYear();

        return (
            <footer className="text-center bg-4">
  
                <p className="user-select-none  text-white">© Copyright  2014-{year}, <a href={CONST_HOME_URL} className="a_nounderline a_hoverinvers"data-toggle="tooltip" title="DroneEngage">{CONST_TITLE}</a> <span className="small text-light text-decoration-underline">  build:{build_number}</span></p> 
    
            </footer>
        );
    }
}



if (CONST_TEST_MODE === true)
	{
        ReactDOM.render(
            <React.StrictMode>
		    <CLSS_FooterControl />
            </React.StrictMode>,
        	
            window.document.getElementById('footer_div')
        );
    
    }
    else
    {
        ReactDOM.render(
        <CLSS_FooterControl  />,
        window.document.getElementById('footer_div')
        );
    }
