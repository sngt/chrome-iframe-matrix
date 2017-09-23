'use strict';

const MAX_FRAME_NUM = 16;

const FrameStateType = Object.freeze({STANDBY: 0, LOADED: 1, EDIT: 2});

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
    chrome.storage.sync.get('sites', (items) => {
        ReactDOM.render(
            <Main sites={items.sites || SAMPLE_SITES}/>, document.querySelector('#matrix-root'));
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
            frameState: FrameStateType.STANDBY
        };
    }

    updateSites(sites) {
        chrome.storage.sync.set({
            sites: sites
        }, () => {
            this.setState({sites: sites});
        });
    }

    switchFrameState() {
        let newFrameState = FrameStateType.LOADED;
        if (this.state.frameState === FrameStateType.LOADED) {
            newFrameState = FrameStateType.EDIT;
        }

        this.setState({frameState: newFrameState});
        this.refs.container.changeFrameState(newFrameState);
        return newFrameState;
    }

    render() {
        return (
            <main>
                <SettingPanel frameState={this.state.frameState} switchFrameState={() => this.switchFrameState()}/>
                <FrameContainer ref="container" sites={this.state.sites} frameState={this.state.frameState} updateSites={(s) => this.updateSites(s)}/>
                <PauseLayer isVisible={this.state.frameState === FrameStateType.STANDBY} proceed={() => this.switchFrameState()}/>
            </main>
        );
    }
}

class SettingPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            frameState: props.frameState
        };
    }

    switchMode() {
        this.setState({frameState: this.props.switchFrameState()});
    }

    render() {
        const editModeClass = this.state.frameState == FrameStateType.EDIT
            ? 'on'
            : '';
        return (
            <aside className="setting">
                <ul>
                    <li className="edit">
                        <i className={'switch ' + editModeClass} onClick={() => this.switchMode()}></i>
                    </li>
                </ul>
            </aside>
        );
    }
}

class FrameContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sites: props.sites,
            frameState: props.frameState
        };
    }

    changeFrameState(frameState) {
        this.setState({frameState: frameState})
    }

    addSite(url) {
        const sites = this.state.sites;
        if (sites.length >= MAX_FRAME_NUM) {
            return;
        }
        sites.push({url: url});
        this.props.updateSites(sites);
    }

    removeSite(index) {
        this.state.sites.splice(index, 1);
        this.props.updateSites(this.state.sites);
    }

    render() {
        switch (this.state.frameState) {
            case FrameStateType.STANDBY:
                return <StandbyContainer sites={this.state.sites}/>;
            case FrameStateType.LOADED:
                return <LoadedContainer sites={this.state.sites}/>;
            case FrameStateType.EDIT:
                return <EditContainer sites={this.state.sites} addSite={(u) => this.addSite(u)} removeSite={(i) => this.removeSite(i)}/>;
            default:
                throw 'Unknown FrameStateType:' + this.state.frameState;
        }
    }
}

const StandbyContainer = (props) => {
    return (
        <ol className={'container container-' + props.sites.length}>
            {props.sites.map((site, index) => (
                <li>
                    <div></div>
                </li>
            ))}
        </ol>
    );
};
const LoadedContainer = (props) => {
    return (
        <ol className={'container container-' + props.sites.length}>
            {props.sites.map((site, index) => (
                <li>
                    <iframe src={site.url}></iframe>
                </li>
            ))}
        </ol>
    );
};
const EditContainer = (props) => {
    let frameNum = props.sites.length;
    if (props.sites.length < MAX_FRAME_NUM) {
        frameNum++;
    }

    return (
        <ol className={'container container-' + frameNum}>
            {props.sites.map((site, index) => (
                <li class="movable">
                    <i data-key={index} className="remove" onClick={() => props.removeSite(index)}></i>
                    <iframe src={site.url}></iframe>
                    <form className="control"></form>
                </li>
            ))}
            <li>
                <iframe></iframe>
                <SiteAdditionForm addSite={(u) => props.addSite(u)}/>
            </li>
        </ol>
    );
};

class SiteAdditionForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sites: props.sites,
            url: ''
        };
    }

    editUrl(event) {
        event.preventDefault();
        this.setState({url: event.target.value});
    }

    addNewSite(event) {
        event.preventDefault();
        const url = this.state.url || '';
        if (url.match(/^http(s)?:\/\/.+/) === null) {
            return;
        }

        this.props.addSite(url);
        this.setState({url: ''});
    }

    render() {
        return (
            <form action="#" className="control add" onSubmit={(e) => {
                this.addNewSite(e)
            }}>
                <input type="url" value={this.state.url} onChange={(e) => {
                    this.editUrl(e)
                }} required="required" placeholder="http://site-url.to.add"/>
                <button>ADD</button>
            </form>
        );
    }
}

class PauseLayer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isVisible: props.isVisible
        };
    }

    hide() {
        this.setState({isVisible: false});
        this.props.proceed();
    }

    render() {
        if (this.state.isVisible !== true) {
            return <div className="hidden"></div>;
        }
        return <div className="overlap" onClick={() => this.hide()}></div>;
    }
}