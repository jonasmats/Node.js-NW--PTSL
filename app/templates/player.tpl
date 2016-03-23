<div class="player-header-background vjs-control-bar">
    <i class="state-info-player fa fa-play"></i>
    <i class="state-info-player fa fa-pause"></i>
	<div class="player-title"><%= title %></div>
	<div class="details-player">
		<% if(quality) { %>
		<span class="quality-info-player"><%= quality %></span>
		<% } %>
		<span class="fa fa-times close-info-player"></span>
		<div class="download-info-player">
			<i class="fa fa-eye eye-info-player"></i>
			<div class="details-info-player">
				<div class="arrow-up"></div>
				<span class="speed-info-player"><%= i18n.__("Download") %>:&nbsp;</span><span class="download_speed_player value">0 B/s</span><br>
				<span class="speed-info-player"><%= i18n.__("Upload") %>:&nbsp;</span><span class="upload_speed_player value">0 B/s</span><br>
				<span class="speed-info-player"><%= i18n.__("Active Peers") %>:&nbsp;</span><span class="active_peers_player value">0</span><br>
				<span class="speed-info-player"><%= i18n.__("Downloaded") %>:&nbsp;</span><span class="downloaded_player value">0</span>
			</div>
		</div>
	</div>
</div>

<iframe src="<%= src %>" frameborder="0" marginwidth="0" marginheight="0" scrolling="NO" allowfullscreen="true" width="100%" height="100%" nwfaketop></iframe>