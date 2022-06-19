if application "Music" is running then
	tell application "Music"
		tell artwork 1 of current track
			return raw data
		end tell
	end tell
end if