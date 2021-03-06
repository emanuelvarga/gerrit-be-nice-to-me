( function( $ ) {

//
var xGerritAuth;
var isNewScreen;
var gerrit_rpc_base = "/gerrit_ui/rpc/";
var current_change_id;
var gerrit_request_id = 1;

var commentPanelClass;
var commentAuthorClass;
var commentSummaryClass;
var commentPanelHeader;
var commentPanelMessage;

function colorComment( $commentPanel ) {
	var author = $commentPanel.find( commentPanelAuthorClass ).text();
	var heading = $commentPanel.find( commentPanelMessage ).eq( 0 ).text(),
		color = '#aaa';
	if (author === getUsername()) {
		color = 'blue';
	} else if ( heading.match( /Code\-Review\-2/ ) || heading.match( /Verified\-2/ ) ) {
		color = '#C90505';
	} else if ( heading.match( /Code\-Review\-1/ ) || heading.match( /Verified\-1/ ) ) {
		color = 'red';
	} else if ( heading.match( /Code\-Review\+1/ ) ) {
		color = 'yellow';
	} else if ( heading.match( /Code\-Review\+2/ ) ) {
		color = 'green';
	}
	$commentPanel.css( {
		'border-left': 'solid 10px ' + color,
		'border-top-left-radius': 0,
		'border-bottom-left-radius': 0
	} );
}

function postJSON(_url, data, func) {
	$.ajax({type: "POST",
			url: _url,
			dataType: "json",
			data: data,
			headers: {"Content-Type":"application/json; charset=UTF-8",
					  "Accept":"application/json; application/jsonrequest; text/html",
					  "X-Gerrit-Auth": xGerritAuth
					 }
			})
	.done(func)
	.fail(function(a){func("badvalue")});
}

function gerritJsonRPC(service, func, params, cb) {
	gerrit_request_id +=1;
	var url = document.location.origin+gerrit_rpc_base+service;
	var jsonData = '{"jsonrpc":"2.0","method":"'+func+'","params":'+JSON.stringify(params)+',"id":'+gerrit_request_id+',"xsrfKey":"'+ xGerritAuth+'"}';
	postJSON(url, jsonData, cb);
}

function getDetail(id, psid, cb) {
	gerritJsonRPC("ChangeDetailService", "patchSetDetail2",[null,{"changeId":{"id":id},"patchSetId":psid},null], function(r){
		cb(r.result);
	});
}

function getChangeOwner() {
    return isNewScreen ? $($('.GKSE20JDE2').find('span').get(1)).text() : $($('.accountLinkPanel').find('gwt-InlineHyperlink')).text();
}

function getUsername() {
    return $('.menuBarUserName').text();
}

function makeCommentTransparent($commentPanel) {
    $commentPanel.find(commentPanelHeader).css('opacity', 0.6);
}

function parseChangeId(href) {
	var orig = href.substring(8)
	orig = orig.substring(orig.indexOf('/'))
	if (orig.indexOf('/c/') != -1)
		orig = orig.substring(orig.indexOf('/c/')+3)
	else if (orig.indexOf('/changes/') != -1)
		orig = orig.substring(orig.indexOf('/changes/')+9)
	else 
		orig = orig.substring(1)
	if (orig.indexOf('/') != -1)
		orig = orig.substring(0, orig.indexOf('/'))
	return orig;
}

function listener( ev ) {
	var $t = $( ev.target ), author, action;

	if ( $t.hasClass( commentPanelClass ) ) { // force open comment panel
		var $authorNode = $t.find( commentPanelAuthorClass );
		author = $authorNode.text();
		action = $t.find( commentPanelSummaryClass ).text();
		if (author === 'builder builder' || author === 'Review Bot') {
		    if (getUsername() === getChangeOwner()) {
		        // make jenkins comments less prominent
		        makeCommentTransparent($t);
		    }
		    else {
		        // reviewers should not see comments related to builder / review bot
		        $t.find(commentPanelHeader).parent().hide();
		    }
		}
		else if (action.indexOf('Uploaded patch set') === 0 || action.match(/was rebased$/)) {
		    // messages regarding patch sets / change rebasing should have the opacity reduced as well
		    makeCommentTransparent($t);
		}
		else if ( !isNewScreen && action.match( /…$/) ) {
			// expand comment
			$t.find( commentPanelSummaryClass ).hide();
			$t.find( '.commentPanelContent' ).show();
		}
		else if ( isNewScreen && action !== '' ) {
			// expand comment
			setTimeout(function() { // yield
				$authorNode.trigger( "click" );
			}, 0)
		}
		colorComment( $t );
	} else if ( $t.hasClass( 'gwt-InlineHyperlink' ) && $t.text() === 'Permalink') {
		current_change_id = parseChangeId($t.attr('href'));
	} else if ( $t.hasClass( 'gwt-DisclosurePanel' ) ) {
		var psText = $t.find( 'tr' ).eq( 0 ).find( 'td' ).eq( 2 ).text().replace('Patch Set ','')
	    getDetail(current_change_id, psText, function(r){
			var parent = r.info.parents[0].id.id;
			var comments = 0;
			r.patches.forEach(function(a) {
				comments += a.nbrComments;
			});
			if (comments > 0)
				$( '<span/>' ).text( ' (' + comments + ')').appendTo( $t.find( 'tr' ).eq( 0 ).find( 'td' ).eq( 2 ) );
			$( '<span/>' ).text( ' / ' + parent ).appendTo( $t.find( '.patchSetRevision' ).eq( 0 ) );
		})
	}
}

function setupClassNames( ) {
    commentPanelClass = isNewScreen ? 'GKSE20JDH4' : 'commentPanel';
    commentPanelAuthorClass = isNewScreen ? '.GKSE20JDI4' : '.commentPanelAuthorCell';
    commentPanelSummaryClass = isNewScreen ? '.GKSE20JDJ4' : '.commentPanelSummary';
    commentPanelHeader = isNewScreen ? '.GKSE20JDF4' : '.commentPanelHeader';
    commentPanelMessage = isNewScreen ? '.GKSE20JDJ4' : '.commentPanelMessage p';
}

document.addEventListener( 'DOMNodeInserted', listener, false );

$.get(document.location.origin.toString())
.done(function(res) {
	xGerritAuth = res.split("xGerritAuth")
	if (xGerritAuth.length>1)
		xGerritAuth = xGerritAuth[1].split('=')[1].split('"')[1]
	else
		xGerritAuth=""

	// new screen can be triggered manually via url (/c2/), which doesn't reflect in json data
	var hasNonGlobalV2Screen = document.location.href.indexOf('/#/c2/') != -1;
	isNewScreen = hasNonGlobalV2Screen || (res.indexOf('CHANGE_SCREEN2') != -1);
	setupClassNames();
});

} )( jQuery );
