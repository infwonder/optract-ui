import Reflux from "reflux";
import DlogsActions from "../action/DlogsActions";
//import OptractService from "../service/OptractService";
import OptractRest from "../service/OptractRest";
import { toHexString } from "multihashes";
const securePass = require('secure-random-password');

const fs = null

class DlogsStore extends Reflux.Store {
	constructor() {
		super();
		this.listenables = DlogsActions;
		//this.opt = OptractService.opt;
		//this.unlockRPC = OptractService.unlockRPC;
		//this.connect = OptractService.connect;
		//this.shutdown = OptractService.shutdown;
		//this.allAccounts = OptractService.allAccounts;

		this.state = {
			originalHashes: ["QmfNaysDYn5ZCGcCSiGRDL4qxSHNWz5AXL7jw3MBj4e3qB"],
			claimTickets: [],
			ticketCounts: 0,
			claimArticles: {},
			claimArticleCounts: 0,
			newArticles: {},
			articles: {},
			articleTotal: 2,
			finalList: {},
			finalListCounts: 0,
			following: [],
			displayBlogs: [],
			onlyShowForBlogger: "",
			currentBlogContent: "",
			login: false,
			logining: false,
			validPass: false,
			generate: false,
			allAccounts: [],
			accListSize: -1,
			account: "0xe8ae1c10267221e7f54f98175dba7b999cd55f2a",
			activeTabKey: "totalList",
			showVoteToaster: false,
			wsrpc: false,
			voted: undefined,
			claimed: undefined,
			// init
			readiness: true,
			// opStats
			EthBlock: 122,
			OptractBlock: 120,
			OproundNo: 10,
			LastBlock: 0,
			PeerCounts: 5,
			Account: "0xE8AE1c10267221e7f54F98175dba7b999CD55F2A",
			AccountBalance: 0,
			MemberStatus: "Active",
			pending: { txdata: {}, payload: {}, txhash: {}, nonces: {} },
			pendingSize: 0,
			// vault
			voteAID: [],
			voteCounts: 0,
			// double claim prevention
			claimAID: [],
			claimCounts: 0,
			// cacheData
			aidlist: [],
			aidlistSize: -1,
			quoteCache: {},
			quoteTotal: 0,
			// streamr
			streamr: false,
			// buy membership lock
			buying: false
		}

		this.probeTout;


		//this.state.articleCache = require('./articleCache.json');
		//console.dir(this.state.articleCache.startBlk);
		//this.state.articles = this.state.articleCache.queries;
		OptractRest.get("articles/cache").then((data) => {
			this.setState({ articles: data });
		})
	}

	// onFetchBlogContent = (article) => {
	// 	this.setState({ currentBlogContent: article.page.content });
	// }

	// onTicketWon = (tic) => {
	// 	console.log(`DEBUG: ticketWon action is called...`);
	// 	if (typeof (tic) === 'object' && Object.keys(tic).length > 0) {
	// 		let outics = [];
	// 		Object.keys(tic).map((bn) => {
	// 			tic[bn].map((t) => { outics.push({ block: bn, txhash: t }) })
	// 		})

	// 		this.setState({ claimTickets: outics, ticketCounts: outics.length });
	// 	} else {
	// 		this.setState({ claimTickets: [], ticketCounts: 0 });
	// 		console.log(`claimTickets for ${this.state.account} is empty ... skipped`)
	// 	}
	// }

	// onConnectRPC = () => {
	// 	if (this.state.wsrpc === true) {
	// 		console.log(`connected`)
	// 		return
	// 	}

	// 	console.log(`DEBUG: connecting RPC...`)
	// 	this.connect();
	// }

	// onCloseOpt = () => {
	// 	this.shutdown();
	// 	window.close();
	// }

	// onStreamrSwitch = () => {
	// 	OptractService.opt.call('streamrSwitch').then((rc) => {
	// 		this.setState({ streamr: rc })
	// 	})
	// }

	// onUnlock = (pw, acc) => {
	// 	this.setState({ logining: true });
	// 	this.unlockRPC(pw, acc, this.unlocked);
	// }

	// onServerCheck = () => {
	// 	console.log(`DEBUG: service check called!!`);
	// 	OptractService.readiness();
	// 	OptractService.serverCheck().then((rc) => {
	// 		this.setState({ logining: true });
	// 		if (rc) {
	// 			this.unlocked();
	// 		} else {
	// 			this.setState({ account: undefined, login: false, logining: false })
	// 		}
	// 	})
	// 		.catch((err) => { true })
	// }

	// onLoadMore = () => {
	// 	OptractService.refreshArticles();
	// }

	// onAllAccounts = () => {
	// 	this.allAccounts();
	// }

	// unlocked = (dispatch = true) => {
	// 	OptractService.statProbe();
	// 	this.setState({ login: true, logining: false })
	// 	OptractService.readiness();
	// 	OptractService.passCheck();
	// 	OptractService.subscribeBlockData();
	// 	OptractService.subscribeOpStats();
	// 	OptractService.subscribeCacheData();
	// 	OptractService.opt.call('dbsync').then((rc) => {
	// 		console.log(`DEBUG: dbsync called..`);
	// 		if (rc) {
	// 			console.log(`DEBUG: Dispatcher called by store ..`);
	// 			OptractService.blockDataDispatcher({});
	// 		} else {
	// 			console.log(`DEBUG: active dispatch is off..`);
	// 		}
	// 	})
	// }

	// onNewAccount = () => {
	// 	if (this.state.buying) return;
	// 	let password = securePass.randomPassword();

	// 	OptractService.opt.call('newAccount', [password]).then((acc) => {
	// 		this.setState({ account: acc, generate: false });
	// 		this.allAccounts();
	// 		DlogsActions.serverCheck();
	// 		OptractService.statProbe();

	// 		this.setState({ buying: true });
	// 		// automatic signup process via streamr
	// 		console.log(`DEBUG: address ${acc} sending membership request...`);
	// 		OptractService.opt.call('signMeUp').then((rc) => {
	// 			this.setState({ buying: false, logining: false });
	// 		})
	// 			.catch((err) => { console.trace(err); this.setState({ buying: false }); });
	// 	})
	// }

	// onOpStateProbe = () => {
	// 	OptractService.statProbe();
	// }
	// /*
	// 	onBuyMembership = () => {
	// 	if (this.state.buying) return;
	// 	this.setState({buying: true});
	// 		OptractService.opt.call('buyMembership').then((rc) => 
	// 	{
	// 		this.setState({buying: false, logining: true, MemberStatus: 'active'});
	// 		this.unlocked();
	// 	})
	// 	.catch((err) => { console.trace(err); this.setState({buying: false}); });
	// 	}
	// */
	// onUpdateState = (state) => {
	// 	this.setState(state);
	// }

	onUpdateTab = activeKey => {
		console.log(`DEBUG: updateTab action is called..`)
		let state = { activeTabKey: activeKey };
		if (Object.keys(this.state.newArticles) > 0) {
			console.log(`DEBUG: updateTab action is causing articles update..`)
			state = { ...state, articles: this.state.newArticles, newArticles: {} };
		}
		this.setState(state);

	}

	// onVote(block, leaf, aid, comment = '') {
	// 	OptractService.newVote(block, leaf, comment).then(data => {
	// 		console.dir(data); console.log(`DEBUG: vote comment = ${comment}`);
	// 		let voteAID = [...this.state.voteAID];

	// 		voteAID.push(aid);
	// 		let voteCounts = voteAID.length;
	// 		this.setState({ voted: undefined, showVoteToaster: true, voteAID, voteCounts })
	// 		clearTimeout(this.probeTout);
	// 		this.probeTout = setTimeout(OptractService.statProbe, 30000);
	// 	});
	// }

	// onClaim(block, leaf, aid) {
	// 	if (this.state.claimTickets.length <= 0) return

	// 	let tickets = [...this.state.claimTickets];
	// 	let ticket = tickets.shift(0);

	// 	OptractService.newClaim(ticket.block, ticket.txhash, block, leaf, 'sent from optract client').then(data => {
	// 		console.dir(data);
	// 		let claimAID = [...this.state.claimAID];
	// 		claimAID.push(aid);
	// 		let claimCounts = claimAID.length;
	// 		this.setState({ claimTickets: tickets, ticketCounts: tickets.length, claimed: undefined, showVoteToaster: true, claimAID, claimCounts })
	// 		clearTimeout(this.probeTout);
	// 		this.probeTout = setTimeout(OptractService.statProbe, 30000);
	// 	});
	// }

	// onOpSurvey(surveyQuiz, surveyPick) {
	// 	OptractService.opt.call('sendInfluence', { surveyQuiz, surveyPick });
	// }

	// onCloseToast() {
	// 	this.setState({ showVoteToaster: false })
	// }

}


DlogsStore.id = "DlogsStore"

export default DlogsStore;
