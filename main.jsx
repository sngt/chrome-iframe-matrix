'use strict';

const MAX_FRAME_NUM = 16;

const SAMPLE_SITES = [
    {
        url: 'https://trends.google.com/trends/'
    }, {
        url: 'http://www.bbc.com/news'
    }, {
        url: 'https://lifehacker.com/'
    }, {
        url: 'https://twitter.com/'
    }
];

window.addEventListener('DOMContentLoaded', () => {
    document.body.style.height = window.innerHeight + 'px';
});

window.addEventListener('load', () => {
    chrome.storage.sync.get([
        'sites', 'options'
    ], (items) => {
        ReactDOM.render(
            <Main sites={items.sites || SAMPLE_SITES} options={items.options}/>, document.querySelector('#matrix-root'));
    });
});

chrome.webRequest.onHeadersReceived.addListener((details) => {
    const headers = details.responseHeaders;
    ['X-FRAME-OPTIONS', 'CONTENT-SECURITY-POLICY'].forEach((header) => {
        for (var i in headers) {
            if (headers[i].name && headers[i].name.toUpperCase() === header) {
                headers.splice(i, 1);
                break;
            }
        }
    });
    return {responseHeaders: headers};
}, {
    urls: ['<all_urls>']
}, ['blocking', 'responseHeaders']);

class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sites: props.sites,
            options: props.options,
            isLoadStarted: false
        };
    }

    updateSites(sites) {
        chrome.storage.sync.set({
            sites: sites
        }, () => {
            this.setState({sites: sites});
        });
    }

    render() {
        return (
            <main>
                <SettingPanel sites={this.state.sites} options={this.state.options} updateSites={(sites) => this.updateSites(sites)}/>
                <FrameContainer ref="container" sites={this.state.sites} updateSites={(sites) => this.updateSites(sites)}/>
                <PauseLayer isVisible={this.state.isLoadStarted !== true} startLoad={() => {
                    this.refs.container.startLoad()
                }}/>
            </main>
        );
    }
}

class SettingPanel extends React.Component {
    constructor(props) {
        super(props);

        this.updateSites = props.updateSites;
        this.state = {
            sites: props.sites || [],
            options: props.options
        };
    }

    render() {
        return (
            <aside className="setting">
                <ul>
                    <li className="edit"><EditSwitch/></li>
                    <li className="options">
                        <SiteAdditionForm sites={this.state.sites} options={this.state.options} updateSites={(sites) => this.updateSites(sites)}/>
                    </li>
                </ul>
            </aside>
        );
    }
}

class EditSwitch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isEditModeOn: false
        };
    }

    switchState() {
        this.setState({
            isEditModeOn: this.state.isEditModeOn == false
        });
    }

    render() {
        return <i className={'switch ' + (this.state.isEditModeOn
            ? 'on'
            : '')} onClick={(e) => this.switchState(e)}></i>;
    }
}

class SiteAdditionForm extends React.Component {
    constructor(props) {
        super(props);

        this.updateSites = props.updateSites;
        this.state = {
            sites: props.sites || [],
            options: props.options,
            newSiteUrl: ''
        };
    }

    editNewSiteUrl(event) {
        event.preventDefault();
        this.setState({newSiteUrl: event.target.value});
    }

    addNewSite(event) {
        event.preventDefault();
        const newSiteUrl = this.state.newSiteUrl || '';
        if (newSiteUrl.match(/^http(s)?:\/\/.+/) === null) {
            return;
        }

        const sites = this.state.sites || [];
        if (sites.length >= MAX_FRAME_NUM) {
            return;
        }

        sites.push({url: newSiteUrl});
        this.updateSites(sites);

        this.setState({newSiteUrl: ''});
    }

    render() {
        if (this.state.sites.length >= MAX_FRAME_NUM) {
            return <form action="#"></form>;
        }

        return (
            <form action="#" onSubmit={(e) => {
                this.addNewSite(e)
            }}>
                <input type="url" value={this.state.newSiteUrl} onChange={(e) => {
                    this.editNewSiteUrl(e)
                }} required="required" placeholder="http://site-url.to.add"/>
                <button className="add">ADD</button>
            </form>
        );
    }
}

class FrameContainer extends React.Component {
    constructor(props) {
        super(props);

        this.updateSites = props.updateSites;
        this.state = {
            sites: props.sites || [],
            isLoadStarted: false
        };
    }

    removeSite(event) {
        event.preventDefault();

        const index = parseInt(event.target.getAttribute('data-key'));
        this.state.sites.splice(index, 1);
        this.updateSites(this.state.sites);
    }

    startLoad() {
        this.setState({isLoadStarted: true});
    }

    render() {
        return (
            <ol className={'container container-' + this.state.sites.length}>
                {this.state.sites.map((site, index) => (
                    <li key={index}>
                        <i data-key={index} className="remove" onClick={(e) => this.removeSite(e)}></i>
                        <SiteFrame ref={index} url={site.url} isLoadStarted={this.state.isLoadStarted}/>
                    </li>
                ))}
            </ol>
        );
    }
}

const SiteFrame = (props) => {
    if (props.isLoadStarted) {
        return <iframe src={props.url}></iframe>;
    } else {
        return <div></div>;
    }
};

class PauseLayer extends React.Component {
    constructor(props) {
        super(props);

        this.startLoad = props.startLoad;
        this.state = {
            isVisible: props.isVisible
        };
    }

    hide() {
        this.setState({isVisible: false});
        this.startLoad();
    }

    render() {
        if (this.state.isVisible != true) {
            return <div className="hidden"></div>;
        }
        return <div className="overlap" onClick={(e) => this.hide(e)}></div>;
    }
}
