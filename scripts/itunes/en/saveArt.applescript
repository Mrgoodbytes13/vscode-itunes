if application "iTunes" is running then
	tell application "iTunes"
		tell artwork 1 of current track
			return raw data
		end tell
	end tell
end if