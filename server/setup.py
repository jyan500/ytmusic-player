if __name__ == "__main__":
	from ytmusicapi import YTMusic, OAuthCredentials
	import os
	from dotenv import load_dotenv
	load_dotenv()
	CLIENT_ID = os.getenv("YT_TV_CLIENT_ID")
	CLIENT_SECRET_ID = os.getenv("YT_TV_CLIENT_SECRET_ID") 
	print(CLIENT_ID)
	print(CLIENT_SECRET_ID)

	# One authenticated client, reused across requests (single-user app).
	yt = YTMusic("oauth.json", oauth_credentials=OAuthCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET_ID))
	print(yt.get_account_info())

