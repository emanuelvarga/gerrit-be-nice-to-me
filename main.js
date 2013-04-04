( function( $ ) {

function colorComment( $commentPanel ) {
	var heading = $commentPanel.find( '.commentPanelMessage p' ).eq( 0 ).text(),
		color = '#aaa';
	if ( heading.match( /Code\-Review\-2$/ ) || heading.match( /Verified\-2$/ ) ) {
		color = '#C90505';
	} else if ( heading.match( /Code\-Review\-1$/ ) || heading.match( /Verified\-1$/ ) ) {
		color = 'red';
	} else if ( heading.match( /Code\-Review\+1$/ ) ) {
		color = 'yellow';
	} else if ( heading.match( /Code\-Review\+2$/ ) ) {
		color = 'green';
	}
	$commentPanel.css( {
		'border-left': 'solid 10px ' + color,
		'border-top-left-radius': 0,
		'border-bottom-left-radius': 0
	} );
}

function listener( ev ) {
	var $t = $( ev.target ), $owner, author, action;
	if ( $t.hasClass( 'commentPanel' ) ) { // force open comment panel
		author = $t.find( '.commentPanelAuthorCell' ).text();
		action = $t.find( '.commentPanelSummary' ).text();
		if ( author === 'jenkins-bot' ||
			action.indexOf( 'Uploaded patch set' ) === 0  ||
			action.match( /was rebased$/ ) ) {
			 // make jenkins comments less prominent
			$t.find( '.commentPanelHeader' ).css( 'opacity', 0.6 );
		} else {
			$t.find( '.commentPanelContent' ).show();
		}
		colorComment( $t );
	} else if ( $t.hasClass( 'gwt-DisclosurePanel' ) ) { // open patchset
		$( '.gwt-DisclosurePanel-closed tbody tr' ).trigger( 'click' ); // HACK! not optimal
	} else if ( $t.children( '.changeTable' ).length > 0 ) {

		var comments = 0;
		$t.find( '.changeTable .commentCell' ).each( function() { // count comments
			var text = $( this ).text(), newCount;
			if ( text ) { // not empty
				text = text.replace( ' comment' ); // errgg hacky sorry
				newCount = parseInt( text, 10 );
				if ( !isNaN( newCount ) ) { // check we got a number
					comments += newCount; // add it to the count
				}
			}
		} );
		$owner = $t.parents( '.gwt-DisclosurePanel' );
		$( '<a class="downloadLink">' ).text( comments + ' comments' ).
			appendTo( $owner.find( 'tr' ).eq( 0 ).find( 'td' ).eq( 2 ) );
		$owner.find( 'tbody tr' ).trigger( 'click' );
	} else if ( $t.hasClass( 'gwt-Image' ) ) {
		// hacky way of detecting page load on my reviews page
		if ( $t.attr( 'src' ) === 'https://gerrit.wikimedia.org/r/gerrit_ui/clear.cache.gif' ) {

			// change the style of all rows to reflect the patchset current score
			$( '.changeTable tr' ).each( function() {
				var color, className;
				if ( $( this ).find( '.negscore.singleLine' ).length > 0 ) {
					className = 'negscore';
					color = 'red';
				} else if ( $( this ).find( '.posscore.singleLine' ).length === 2 ) {
					className = 'posscore';
					color = '#08a400';
				} else {
					className = false;
				}
				if ( className ) {
					$( this ).find( 'td' ).each( function() {
						$( this ).addClass( className + ' dataCell' ).
							find( 'a' ).attr( 'style', 'color: ' + color + ' !important;' ); // ergg WHY GERRIT WHY?!!
					} );
				}
			} );
		}
	}
}
document.addEventListener( 'DOMNodeInserted', listener, false );

} )( jQuery );
