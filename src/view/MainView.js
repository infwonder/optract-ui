'use strict';

// Third-party packages
import Reflux from "reflux";
import React from "react";
import { Tabs, Tab, Toast, Modal } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import renderHTML from 'react-render-html';
import marked from "marked";
import Form from "react-bootstrap/Form";
import Toggle from 'react-toggle';

// Store
import DlogsStore from "../store/DlogsStore";

// Actions
import DlogsActions from "../action/DlogsActions";

// Views
import LoginView from "./LoginView";

// Misc 
import { createCanvasWithAddress } from "../util/Utils";


class MainView extends Reflux.Component {

    constructor(props) {
        super(props);
        this.state = {
            view: "List",
            currentBlog: "",
            showModal: false,
            loading: false,
            opSurveyAID: '0x',
            surveyPick: null,
            surveyQuiz: null,
            greeting: 'Optract',
            thePosition: window.pageYOffset,
            readAID: [],
            readCount: 0,
            // Login view state props
            signUpInfo: 'Welcome and thank you for trying Optract!'
        }


        this.tabCache = {};

        this.store = DlogsStore;
        this.loadTimer;
        this.initTimer;
        this.stateSip;
        this.cateOpsCounts = 0;
        this._a = 0;
    }

    componentDidUpdate() {
        if (typeof (this.refs.canvas) !== 'undefined') {
            createCanvasWithAddress(this.refs.canvas, this.state.account);
        }
        if (this.state.login === false) {
            if (this.state.validPass && this.state.MemberStatus === 'active' && this.state.account !== null) {
                this.setState({ login: true, logining: false });
            } else {
                return;
            }
        }

        if (typeof (this.state.account) === 'undefined') {
            if (this.state.accListSize === 0) {
                clearTimeout(this.initTimer);
                this.initTimer = setTimeout(DlogsActions.updateState, 5001, { login: false, logining: false });
                return; // kick back to login for new account creation
            } else if (this.state.accListSize > 0) {
                clearTimeout(this.initTimer);
                this.initTimer = setTimeout(DlogsActions.updateState, 5001, { login: false, logining: false, validPass: false });
                return; // kick back to login for new account creation
            }
            console.log(`main view did update reset called...`);
            return;
        } else if (this.state.account !== null
            && typeof (this.state.account) !== 'undefined'
            && this.state.account === this.state.Account
            && this.state.MemberStatus === 'not member'
        ) {
            clearTimeout(this.initTimer);
            this.initTimer = setTimeout(DlogsActions.updateState, 1001, { login: false, logining: false });
            console.log(`main view did update registration called...`);
            return;
        } else if (this.state.articleTotal === 0) {
            clearTimeout(this.initTimer);
            this.initTimer = setTimeout(() => {
                DlogsActions.opStateProbe();
                this.state.greeting === 'Optract' ? this.setState({ greeting: 'From Info to Insights' }) : this.setState({ greeting: 'Optract' });
            }, 3000);
        }

        if (typeof (this.refs.canvas) !== 'undefined') {
            createCanvasWithAddress(this.refs.canvas, this.state.account);
            if (typeof (this.stateSip) === 'undefined' || Math.floor(Date.now() / 1000) - this.stateSip > 60) {
                clearTimeout(this.initTimer);
                this.initTimer = setTimeout(DlogsActions.opStateProbe, 5100);
                this.stateSip = Math.floor(Date.now() / 1000);
            }
        }

        if (this.state.showModal !== false) {
            let aid = this.state.showModal;
            let total = this.state.quoteCache[aid].total;

            Object.keys(this.state.quoteCache[aid].cmtlist).map((acc) => {
                if (typeof (this.refs['canvas_' + acc]) !== 'undefined') {
                    createCanvasWithAddress(this.refs['canvas_' + acc], acc);
                }
            })
        }

        if (typeof (this.refs.ticketNote) !== 'undefined' && this.state.ticketCounts === 0) {
            this.refs.ticketNote.style.display = 'none';
        } else if (typeof (this.refs.ticketNote) !== 'undefined' && this.state.ticketCounts > 0) {
            if (this.cateOpsCounts > 0 && this.state.claimCounts < this.state.claimArticleCounts) {
                this.refs.ticketNote.style.display = 'inline-block';
            } else {
                this.refs.ticketNote.style.display = 'none';
            }
        }
    }

    componentDidMount() {
        window.addEventListener('scroll', this.listenToScroll.bind(this))
    }



    componentWillUnmount() {
        window.removeEventListener('scroll', this.listenToScroll.bind(this))
    }

    listenToScroll = (e) => {
        const winScroll =
            document.body.scrollTop || document.documentElement.scrollTop

        const height =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight

        const scrolled = winScroll / height

        this.setState({
            thePosition: scrolled,
        })
        e.stopPropagation();
    }

    getImgSize = ({ target: img }) => {
        if (img.naturalWidth < 420 || img.naturalWidth / img.naturalHeight < 2.1) img.style.minWidth = '415px';
        if (img.naturalHeight < 200 || img.naturalWidth / img.naturalHeight > 2.1) img.style.minHeight = '200px';
    }

    pickLeadImage = (article) => {
        // special cases
        try {
            if (article.page.domain.match('slashdot.org')) return (<img src='assets/slashdot_optract_logo.png' style={{ minWidth: 'unset' }}></img>)
        } catch (err) {
            console.log(`DEBUG: pickLeadImage:`)
            console.trace(err);
            console.dir(article);
            return (<img src='assets/optract_logo.png' style={{ minWidth: 'unset' }}></img>)
        }

        // normal cases
        if (article.page.lead_image_url) {
            return (<img onLoad={this.getImgSize.bind(this)} src={article.page.lead_image_url}></img>)
        } else {
            return (<img src='assets/optract_logo.png' style={{ minWidth: 'unset' }}></img>)
        }
    }

    genExcerpt = (article) => {
        try {
            if (article.page.excerpt === '') article.page.excerpt = '(no preview texts)';
            return renderHTML(marked(article.page.excerpt.substring(0, 140) + '...'))
        } catch (err) {
            article.page.excerpt = '(no preview texts)';
            return renderHTML(marked(article.page.excerpt))
        }
    }

    genVoteButtons = (article) => {
        let aid = article.myAID;
        return (<div className="aidclk" style={{ gridColumnGap: '42px', padding: '10px', borderTop: '1px solid lightgray', backgroundColor: '#fdfdfd' }} onClick={() => { }}>
            <div className="button" id="hoverClick"
                style={{ textAlign: 'center', cursor: 'pointer', display: 'grid', justifyContent: 'center', alignContent: 'center', color: 'black', border: '1px groove black', fontSize: '18px', display: 'grid', paddingTop: '2px', paddingLeft: '2px', width: '86px', height: '37px' }}
                onClick={typeof (this.state.voted) === 'undefined' ? this.vote.bind(this, article, aid) : this.goToArticle.bind(this, article)}>
                {this.state.voted === aid
                    ? <p style={{ padding: '0px', margin: '0px' }}><span className="dot dotOne">-</span><span className="dot dotTwo">-</span><span className="dot dotThree">-</span></p>
                    : 'Vote'}
            </div>
            {this.state.quoteTotal > 0 && typeof (this.state.quoteCache[aid]) !== 'undefined' && this.state.quoteCache[aid].total > 0 ?
                <div className="button" id="hoverClick" onClick={this.setShowModal.bind(this, aid)}
                    style={{ textAlign: 'center', cursor: 'pointer', display: 'grid', alignContent: 'center', backgroundImage: 'url(assets/quote.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', border: 'none', width: '88px', height: '42px', fontSize: '18px', color: 'black' }}>
                    {this.state.quoteCache[aid].total > 50 ? '50+' : this.state.quoteCache[aid].total}
                </div> : ''}
        </div>)
    }

    // need to prepare questions more or equal to user ticket counts
    // this function should eventually takes aid as input, and return
    // proper questionire based on the aid category and other keywords
    opSurveyPoC = (aid) => {
        if (this.state.opSurveyAID !== '0x' && this.state.opSurveyAID !== aid) {
            let readAID = this.state.readAID;
            if (this.state.claimAID.indexOf(this.state.opSurveyAID) === -1) {
                readAID.splice(readAID.indexOf(this.state.opSurveyAID), 1);
                this.setState({ readAID, opSurveyAID: aid, readCount: readAID.length });
            } else {
                this.setState({ opSurveyAID: aid });
            }
        } else if (this.state.opSurveyAID === '0x') {
            this.setState({ opSurveyAID: aid });
        }

        let Qs = {
            "If you are a fan of comics or movie series, how much will you spend on tied-in or themed products?":
                { 'Under $50.': 0, 'Under $100.': 1, 'Under $250.': 2, 'No difference.': 3 },
            "Where did you learn about Optract?":
                { 'Official or news website.': 0, 'Twitter or Facebook page.': 1, 'from other friends.': 2, 'Meetups or workshops.': 3 },
            "How many subscription based services you or your family currently have?":
                { 'Under 5.': 0, '5 to 10.': 1, 'over 15.': 2, 'None.': 3 },
            "What is your most-wanted gadget this holiday season?":
                { 'Smart watches.': 0, 'Smart phones.': 1, 'Game consoles.': 2, 'Smart TVs or set-top boxes.': 3 },
            "Should mankind simply colonize Mars or other planets without worrying about Earth?":
                { 'Yes.': 0, 'No.': 1, 'Yes, if our technology allows.': 2, 'No, sustainability matters.': 3 },
            "Do you believe crypto currency will one day replace conventional banks?":
                { 'No, banks will adopt it.': 0, 'No. destroyed by governments.': 1, 'Yes, but heavily regulated.': 2, 'Yes, because we want it.': 3 },
            "Do you think Ethereum 2.0 will be released on time as planned?":
                { 'Yes.': 0, 'No.': 1, 'Yes, but delayed.': 2, 'No, it will never be done.': 3 },
            "Do you think you will lose your current job to AI or robots?":
                { 'Yes.': 0, 'No.': 1, 'Yes, but not any time soon': 2, 'No, not in my life time.': 3 },
            "Will your next smartphone be an iPhone from Apple?":
                { 'Yes.': 0, 'No.': 1, 'Yes, but not any time soon': 2, 'No, switching to Android': 3 },
            "How much would you pay for 5G data plan on mobile?":
                { 'The same price as my current plan': 0, 'No more than 15% more': 1, 'No more than 20% more': 2, 'Do not plan to switch': 3 },
            "Are you enjoying Optract so far? If so, how much would you pay for it monthly?":
                { 'Yes, $1/mo.': 0, 'Yes, $2/mo.': 1, 'Yes, ad-supported freemium.': 2, 'No.': 3 },
            "What other categories you would like to see on Optract?":
                { 'Education': 0, 'Politics': 1, 'Health': 2, 'All of above': 3 }
        };

        let i = Object.keys(Qs).length;
        let r = parseInt('0x' + aid.split('').splice(aid.length - 2, 2).join(''), 16) % i;
        let Q = Object.keys(Qs).sort()[r];

        return { Q, S: Qs[Q] };
    }

    handleSurveyPick = (event) => {
        console.log(`DEBUG: survey pick ${event.target.id}`);
        this.setState({ surveyPick: event.target.id })
    }

    genClaimButtons = (article) => {
        let aid = article.myAID;

        if (this.state.ticketCounts > 0) {
            let svy = this.opSurveyPoC.apply(this, [aid]);
            if (this.state.serveyQuiz !== svy.Q) this.setState({ serveyQuiz: svy.Q });

            return (<div className="item aidsvy" onClick={() => { }}>
                <div className="item svyQ">{svy.Q}</div>
                <div className="item svyS">
                    <Form>
                        <Form.Group>
                            {
                                Object.keys(svy.S).map((ans) => {
                                    return <Form.Check
                                        style={{ cursor: "pointer" }}
                                        type="radio"
                                        label={ans}
                                        id={aid + '_' + svy.S[ans]}
                                        checked={this.state.surveyPick === aid + '_' + svy.S[ans]}
                                        onChange={this.handleSurveyPick.bind(this)}>
                                    </Form.Check>
                                })
                            }
                        </Form.Group>
                    </Form>
                </div>
                <div className="button svyB"
                    style={{ border: '1px solid yellow', color: 'yellow', textAlign: 'center', right: '25px', cursor: 'pointer', display: 'inline-block' }}
                    onClick={typeof (this.state.claimed) === 'undefined' ? this.claim.bind(this, article, aid) : this.goToArticle.bind(this, article)}>
                    {this.state.claimed === aid ? <p style={{ padding: '0px', margin: '0px' }}><span className="dot dotOne">-</span><span className="dot dotTwo">-</span><span className="dot dotThree">-</span></p> : 'Claim'}
                </div>
            </div>)
        } else {
            return (<div className="item aidclk" onClick={() => { }} style={
                { minHeight: '94px', color: 'darkred', backgroundColor: '#dee2e6', fontSize: '20px', textAlign: 'center', gridTemplateColumns: '1fr', borderTop: "1px solid #dee2e6" }} onClick={this.goToArticle.bind(this, article)}>You have 0 ticket left to vote!
		</div>)
        }
    }

    handleShowButton = (article) => {
        if (article.claimable === true) {
            if (this.state.ticketCounts > 0 && this.state.claimAID.indexOf(article.myAID) !== -1) {
                return (<div className="item aidclk" style={
                    { minHeight: '94px', color: 'darkgreen', backgroundColor: '#dee2e6', fontSize: '20px', textAlign: 'center', gridTemplateColumns: '1fr', borderTop: "1px solid #dee2e6" }
                } onClick={this.goToArticle.bind(this, article)}>You still have {this.state.ticketCounts} ticket(s)</div>)
            } else {
                return this.genClaimButtons.apply(this, [article])
            }
        } else if (this.state.activeTabKey === 'finalList') {
            return (<div className="item aidclk" style={
                { minHeight: '94px', color: 'darkgreen', backgroundColor: '#dee2e6', fontSize: '20px', textAlign: 'center', gridTemplateColumns: '1fr', borderTop: "1px solid #dee2e6" }
            } onClick={this.goToArticle.bind(this, article)}>Read It!!!</div>)
        } else if (this.state.voteCounts > 0 && this.state.voteAID.indexOf(article.myAID) !== -1) {
            return (<div className="item aidclk" style={
                { minHeight: '94px', color: 'darkgreen', backgroundColor: '#dee2e6', fontSize: '20px', textAlign: 'center', gridTemplateColumns: '1fr', borderTop: "1px solid #dee2e6" }
            } onClick={this.goToArticle.bind(this, article)}>You've already voted this.</div>)
        } else if (this.state.MemberStatus !== 'active') {
            return (<div className="item aidclk" style={
                { minHeight: '94px', color: 'darkgreen', backgroundColor: '#dee2e6', fontSize: '20px', textAlign: 'center', gridTemplateColumns: '1fr', borderTop: "1px solid #dee2e6" }
            } onClick={this.goToArticle.bind(this, article)}>Please Register To Participate!</div>)
        } else {
            return this.genVoteButtons.apply(this, [article])
        }
    }

    handleNoArticles = (activeTab) => {
        if (activeTab === 'claim') {
            return (<div className="item noticeBoard"><p>No articles for reward claiming yet...</p></div>)
        } else if (activeTab === 'finalList') {
            return (<div className="item noticeBoard"><p>No article was elected into final list yet...</p></div>)
        } else {
            return (<div className="item noticeBoard"><p>No articles curated for this category ...</p></div>)
        }
    }

    streamrSwitch = () => { DlogsActions.streamrSwitch() }

    genOpStatsPage = () => {
        this.cateOpsCounts = 0;
        return (<div className="statusBoard">
            <div className="item EthBlk">EthBlock:<br />{this.state.EthBlock}</div>
            <div className="item OptBlk">OptBlock:<br />{this.state.OptractBlock}</div>
            <div className="item OptNo">OptNo:<br />{this.state.OproundNo}</div>
            <div className="item Peers">Peers:<br />{this.state.PeerCounts}</div>
            <div className="item plist">
                <div style={{ alignSelf: 'start' }}>
                    <hr style={{ minWidth: '100%', alignSelf: 'start', borderTop: '1px solid #dee2e6' }} />
                    <Table className="statTable" style={{ margin: '50px 0 25px 0', minWidth: '77vw', alignSelf: 'start' }} striped bordered hover>
                        <tbody>
                            <tr>
                                <td style={{
                                    borderLeft: '1px solid white', borderTop: '1px solid white', borderBottom: '1px solid white',
                                    backgroundColor: 'white', textAlign: 'center'
                                }} rowSpan="2">
                                    <canvas className="avatar" ref='canvas' width="190px" height="190px" />
                                </td>
                                <td>Account Address</td><td>Streamr</td><td>Member Status</td>
                            </tr>
                            <tr>
                                <td style={{ fontFamily: 'monospace', padding: '30px' }}>{this.state.account}</td>
                                <td style={{ fontFamily: 'monospace', padding: '30px' }}><Toggle
                                    id='streamr-check'
                                    defaultChecked={this.state.streamr}
                                    onChange={this.streamrSwitch.bind(this)} /></td>
                                <td style={{ fontFamily: 'monospace', padding: '30px' }}>{this.state.MemberStatus}</td>
                            </tr>
                            <tr><td colSpan="4" style={{ backgroundColor: 'white', borderRight: '1px solid white', borderLeft: '1px solid white' }}><br /></td></tr>
                            <tr><td colSpan="4" style={{ backgroundColor: 'white', borderRight: '1px solid white', borderLeft: '1px solid white' }}><br /></td></tr>
                            <tr><td colSpan="4">Pending Transactions {this.state.pendingSize === 0 ? '' : `(Total: ${this.state.pendingSize})`}</td></tr>
                            {this.state.pendingSize === 0
                                ? <tr>
                                    <td colSpan="4" style={{ fontFamily: 'monospace' }}><p style={{ padding: '0px 240px' }}>No pending Transactions</p></td>
                                </tr>
                                : this.state.pending.txhash[this.state.account].map((tx) => {
                                    return <tr><td colSpan="4" style={{ fontFamily: 'monospace' }}>{tx}</td></tr>
                                })}
                        </tbody>
                    </Table>
                </div>
            </div>
        </div>)
    }

    getArticleList = () => {
        //timer trick for loader
        if (this.state.loading === true) {
            clearTimeout(this.loadTimer);
            this.loadTimer = setTimeout(() => { this.setState({ loading: false }) }, 3500);
        }

        let articles = this.state.articles;
        if (this.state.activeTabKey === 'opStats') return this.genOpStatsPage.apply(this);
        if (Object.keys(articles).length === 0) return this.handleNoArticles.apply(this, [this.state.activeTabKey]);

        let claimArticles = {};
        let pagelist = Object.keys(articles).filter(aid => {
            if (typeof (articles[aid].page) !== 'undefined'
                && typeof (articles[aid].page.err) === 'undefined'
                && typeof (articles[aid].page.error) === 'undefined'
            ) {
                if (this.state.finalListCounts > 0 && typeof (this.state.finalList[aid]) !== 'undefined') articles[aid]['final'] = true;
                if (this.state.ticketCounts > 0 && this.state.claimArticleCounts > 0 && typeof (this.state.claimArticles[aid]) !== 'undefined') {
                    if (this.state.activeTabKey == "totalList") {
                        claimArticles[aid] = articles[aid];
                    } else if (articles[aid].tags.tags.includes(this.state.activeTabKey)) {
                        claimArticles[aid] = articles[aid];
                    }
                    return false; // delay and append claim article rendering 
                } else {
                    articles[aid].claimable = false;
                }

                if (this.state.activeTabKey == "totalList") return true;
                return articles[aid].tags.tags.includes(this.state.activeTabKey)
            }
        })

        if (pagelist.length === 0) return this.handleNoArticles.apply(this, [this.state.activeTabKey]);

        let outputs = pagelist.map((aid) => {
            let article = articles[aid];
            article['myAID'] = aid;
            if (article.page.excerpt === null) article.page.excerpt = '(no preview texts)';
            return <div title={'Source: ' + article.page.domain} className="aidcard">
                <div className="aidtitle" onClick={this.goToArticle.bind(this, article)}>
                    <p style={{ padding: '3px', fontWeight: 'bold', color: '#000000', fontSize: '22px' }}>{article.page.title}</p>
                    <p style={{ padding: '5px', fontSize: '18px' }}>{this.genExcerpt.apply(this, [article])}</p>
                </div>
                <div className="aidpic" onClick={this.goToArticle.bind(this, article)}>
                    {typeof (article.final) !== 'undefined' ? <div class="ribbon ribbon-top-right"><span>Final List</span></div> : ''}
                    {this.pickLeadImage.apply(this, [article])}
                </div>
                {
                    this.state.readCount > 0 && this.state.readAID.indexOf(aid) !== -1
                        ? this.handleShowButton.apply(this, [article])
                        : <div className="item aidclk"
                            style={{ minHeight: '94px', color: 'darkgreen', backgroundColor: '#dee2e6', fontSize: '20px', textAlign: 'center', gridTemplateColumns: '1fr', borderTop: "1px solid #dee2e6" }}
                            onClick={this.goToArticle.bind(this, article)}> You can vote this with optract extension.
                        </div>
                }
            </div>
        });

        if (this.state.ticketCounts === 0 || Object.keys(claimArticles).length === 0 || this.state.claimCounts >= this.state.claimArticleCounts) {
            this.cateOpsCounts = 0;
            return outputs;
        } else {
            outputs.push(<div className="opsLine" id='opsLine'>OpSurvey</div>)
            outputs = [...outputs, ...Object.keys(claimArticles).map((aid) => {
                let article = claimArticles[aid];
                article['myAID'] = aid;
                article['claimable'] = true;
                if (article.page.excerpt === null) article.page.excerpt = '(no preview texts)';
                return <div title={'Source: ' + article.page.domain} className="aidcard" style={{ border: '1px solid goldenrod' }}>
                    <div className="aidtitle" onClick={this.goToArticle.bind(this, article)}>
                        <p style={{ padding: '3px', fontWeight: 'bold', color: '#000000', fontSize: '22px' }}>{article.page.title}</p>
                        <p style={{ padding: '5px', fontSize: '18px' }}>{this.genExcerpt.apply(this, [article])}</p>
                    </div>
                    <div className="aidpic" onClick={this.goToArticle.bind(this, article)}>
                        {this.pickLeadImage.apply(this, [article])}
                    </div>
                    {
                        this.state.readCount > 0 && this.state.readAID.indexOf(aid) !== -1
                            ? this.handleShowButton.apply(this, [article])
                            : <div className="item aidclk"
                                style={{ minHeight: '94px', color: 'darkgreen', backgroundColor: '#dee2e6', fontSize: '20px', textAlign: 'center', gridTemplateColumns: '1fr', borderTop: "1px solid #dee2e6" }}
                                onClick={this.goToArticle.bind(this, article)}> You can vote this with optract extension.
                            </div>
                    }
                </div>
            })];

            this.cateOpsCounts = Object.keys(claimArticles).length;
            return outputs;
        }
    }

    goToArticle = (article) => {
        let readAID = this.state.readAID;
        if (readAID.indexOf(article.myAID) === -1) {
            readAID.push(article.myAID);
            this.setState({ readAID, readCount: readAID.length });
        }

        let active = false;
        if (typeof (this.state.quoteCache[article.myAID]) === 'undefined') active = true;
        if (this.state.voteAID.indexOf(article.myAID) !== -1) {
            if (typeof (this.state.quoteCache[article.myAID]) === 'undefined') {
                active = true;
            } else {
                active = false;
                this.setState({ showModal: article.myAID });
            }
        }
        window.open(article.url, '_blank');
        // chrome.tabs.getCurrent((myTab) => {
        //     chrome.tabs.create({ url: article.url, active, openerTabId: myTab.id }, (tab) => { this.tabCache[article.myAID] = tab.id; });
        // });
        // DlogsActions.fetchBlogContent(article);
        // this.setState({ view: "Content", currentBlog: article });
    }

    goToArticleNow = (article) => {
        let readAID = this.state.readAID;
        if (readAID.indexOf(article.myAID) === -1) {
            readAID.push(article.myAID);
            this.setState({ readAID, readCount: readAID.length });
        }
        window.open(article.url, '_blank');
        // chrome.tabs.getCurrent((myTab) => {
        //     chrome.tabs.create({ url: article.url, active: true, openerTabId: myTab.id }, (tab) => { this.tabCache[article.myAID] = tab.id; });
        // });
        // DlogsActions.fetchBlogContent(article);
        // this.setState({ view: "Content", currentBlog: article });
    }

    goToAidArticle = (aid) => {
        let article = this.state.articles[aid];
        chrome.tabs.update(this.tabCache[aid], { active: true }, () => {
            if (chrome.extension.lastError) this.goToArticleNow.apply(this, [article]);
        })
    }

    goBackToList = () => {
        this.setState({ view: "List", currentBlog: "" })
    }

    updateTab = (activeKey) => {
        if (activeKey === "claim") {
            this.setShowModal(true);
        }

        DlogsActions.updateTab(activeKey);
        this.goBackToList();
    }

    vote = (article, aid, e) => {
        this.setState({ voted: aid });
        let l = article.txs.length;
        let i = Math.floor(Math.random() * l);
        DlogsActions.vote(article.blk[i], article.txs[i], aid);
        e.stopPropagation();
    }

    claim = (article, aid, e) => {
        this.setState({ claimed: aid, opSurveyAID: '0x' });
        let v2blk = this.state.claimArticles[aid].blk[0];
        let v2txh = this.state.claimArticles[aid].txs[0];
        DlogsActions.claim(v2blk, v2txh, aid);
        if (this.state.streamr === true) DlogsActions.opSurvey(surveyQuiz, surveyPick);
        e.stopPropagation();
    }

    closeToast = () => {
        DlogsActions.closeToast();
    }

    closeOpt = () => {
        DlogsActions.closeOpt();
    }

    setShowModal = showModal => {
        this.setState({ showModal: showModal });
    }

    moreArticles = () => {
        if (this.state.loading === false) this.setState({ loading: true });
        DlogsActions.loadMore();
    }

    loginLoad = () => {
        if (typeof (this.state.account) === 'undefined') {
            return 'Account not selected, return to login page in 5 secs ...';
        }

        if (typeof (this.state.account) !== 'undefined'
            && this.state.account === this.state.Account
            && this.state.MemberStatus !== 'active'
        ) {
            return 'Account not registered, please register at www.optract.com...';
        }

        return this.state.EthBlock > 0 ? `Last Synced: ${this.state.LastBlock}/${this.state.OptractBlock} | Peers: ${this.state.PeerCounts}` : `Loading ...`;
    }

    scrollToTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    updateState = (staObj) => { this.setState(staObj) }

    render() {
        console.log(`DEBUG: quoteTotal: ${this.state.quoteTotal}`);

        // if (this.state.articleTotal === 0) {
        //     //document.getElementById('app').style.background = 'linear-gradient(180deg,#52a9ff 0,#2eff43),url(assets/loadbg.png)'; // Optract theme
        //     //document.getElementById('app').style.background = 'linear-gradient(180deg,#52a9ff 0,#2eff43),url(assets/loadbg2.png)'; // ribbin theme
        //     //document.getElementById('app').style.background = 'linear-gradient(180deg,#52a9ff 0,#2eff43),url(assets/loadbg3.png)'; // contour theme
        //     if (this.state.login === false) {
        //         document.getElementById('app').style.animation = 'fadeInOpacity 2s ease-in-out 1';
        //         document.getElementById('app').style.background = 'url(assets/loginbg2.png)';
        //     } else {
        //         document.getElementById('app').style.animation = 'fadeInOpacity 2s ease-in-out 1';
        //         document.getElementById('app').style.background = 'url(assets/loginbg.png),linear-gradient(-10deg,lightgray 0, #000000aa)';
        //     }
        //     document.getElementById('app').style.backgroundBlendMode = 'multiply';
        //     //document.getElementById('app').style.animation = 'colorful 11s ease 1.11s infinite alternate'; // hue-rotation
        //     document.getElementById('app').style.backgroundOrigin = 'border-box';
        //     document.getElementById('app').style.backgroundRepeat = 'no-repeat';
        //     document.getElementById('app').style.backgroundPosition = 'center';
        //     document.getElementById('app').style.backgroundSize = 'cover';
        // } else if (this.state.MemberStatus !== 'not member') {
        //     document.getElementById('app').style.animation = 'fadeInOpacity 2s ease-in-out 1';
        //     console.log(`DEBUG: in Rander section M2`);
        //     document.getElementById('app').style.animation = '';
        //     document.getElementById('app').style.background = '';
        //     document.getElementById('app').style.backgroundBlendMode = '';
        //     document.getElementById('app').style.backgroundImage = 'none';
        //     document.getElementById('app').style.backgroundColor = 'aliceblue';
        // }

        return (

            <div className="content">
                <button onClick={this.scrollToTop.bind(this)}
                    id="TopBtn"
                    style={this.state.thePosition >= 0.2 ? { display: 'block' } : { display: 'none' }}
                    title="Go to top">Top
                   </button>
                <div className="ticketNote"
                    ref='ticketNote'
                    style={{ display: 'none' }}>
                    <a href='#opsLine'>You have {this.state.ticketCounts} tickets!</a>
                </div>
                <div className="item contentxt">
                    {
                        this.state.articleTotal > 0 ?
                            <Tabs defaultActiveKey="totalList" onSelect={this.updateTab}>
                                <Tab eventKey="totalList" title="ALL"></Tab>
                                <Tab eventKey="tech" title="Tech"></Tab>
                                <Tab eventKey="gadget" title="Gadgets"></Tab>
                                <Tab eventKey="emergingTech" title="Emerging"></Tab>
                                <Tab eventKey="review" title="Reviews"></Tab>
                                <Tab eventKey="science" title="Science"></Tab>
                                <Tab eventKey="blockchain" title="Blockchain"></Tab>
                                <Tab eventKey="finance" title="Finance"></Tab>
                                <Tab eventKey="investment" title="Investment"></Tab>
                                <Tab eventKey="__" disabled title="|"></Tab>
                                <Tab eventKey="opStats" title="Status"></Tab>
                            </Tabs> : ''}
                    {this.state.view === "List" ?
                        this.state.articleTotal === 0 ?
                            <div className='item login' style={{ height: 'calc(100vh - 100px)' }}>
                                <div className='textloader'
                                    style={{ height: 'fit-content', margin: '0px auto', alignSelf: 'end', backgroundColor: 'rgba(0,0,0,0)', fontSize: '72px' }}>
                                    {this.state.greeting}
                                </div>
                                <label className='loaderlabel'>{this.loginLoad.apply(this, [])}</label>
                            </div> :
                            <div className="articles"> {this.getArticleList()}</div> : ''}
                </div>
                <Modal
                    show={this.state.showModal !== false}
                    onHide={() => this.setShowModal(false)}
                    dialogClassName="modal-90w"
                    aria-labelledby="quote-modal-title"
                >
                    <Modal.Header closeButton>
                        <Modal.Title id="quote-modal-title" style={{ fontSize: "3rem" }}>
                            - Highlights from other Optract members
                  	    </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ fontSize: "2rem" }}>
                        {
                            this.state.showModal !== false && typeof (this.state.quoteCache[this.state.showModal]) !== 'undefined'
                                ? Object.keys(this.state.quoteCache[this.state.showModal].cmtlist).map((acc, i) => {
                                    return (<div className="quoteTable">
                                        <div className="avatarq" title={'Optract Member: ' + acc}><canvas ref={'canvas_' + acc}
                                            style={{ boxShadow: '0px 1px 10px -1px', border: '4px solid #dee2e6', justifySelf: 'right', alignSelf: 'end', borderRadius: '5em' }} />
                                        </div>
                                        <div className="quoteq" style={i % 2 === 0 ? { backgroundColor: 'cornsilk' } : { backgroundColor: 'white' }}>
                                            <p style={{ alignSelf: 'center', justifySelf: 'center', fontSize: '28px', margin: '10px' }}>
                                                {this.state.quoteCache[this.state.showModal].cmtlist[acc]}</p>
                                        </div>
                                    </div>)
                                })
                                : ''
                        }
                        <hr /><div
                            style={{ cursor: 'pointer', textAlign: 'center', margin: '20px auto 10px auto', fontSize: '22px', border: '2px solid', maxWidth: '250px' }}
                            onClick={this.goToAidArticle.bind(this, this.state.showModal)}>read full article
                            </div>
                    </Modal.Body>
                </Modal>
            </div>);

    }

}

export default MainView;
