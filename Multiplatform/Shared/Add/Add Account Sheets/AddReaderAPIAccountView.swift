//
//  AddReaderAPIAccountView.swift
//  Multiplatform macOS
//
//  Created by Stuart Breckenridge on 03/12/2020.
//  Copyright © 2020 Ranchero Software. All rights reserved.
//

import SwiftUI
import Account
import RSCore
import RSWeb
import Secrets

struct AddReaderAPIAccountView: View {
	
	@Environment (\.presentationMode) var presentationMode
	@StateObject private var model = AddReaderAPIViewModel()
	public var accountType: AccountType
	
	var body: some View {
		#if os(macOS)
		macBody
		#else
		iosBody
		#endif
	}
	
	#if os(iOS)
	var iosBody: some View {
		Text("TBC")
	}
	#endif
	
	#if os(macOS)
	var macBody: some View {
		VStack {
			HStack(spacing: 16) {
				VStack(alignment: .leading) {
					accountType.image()
						.resizable()
						.frame(width: 50, height: 50)
					Spacer()
				}
				VStack(alignment: .leading, spacing: 8) {
					Text("Sign in to your \(accountType.localizedAccountName()) account.")
						.font(.headline)
					HStack {
						if accountType == .freshRSS {
							Text("Don't have a \(accountType.localizedAccountName()) instance?")
								.font(.callout)
						} else {
							Text("Don't have an \(accountType.localizedAccountName()) account?")
								.font(.callout)
						}
						Button(action: {
							model.presentSignUpOption(accountType)
						}, label: {
							Text(accountType == .freshRSS ? "Find out more." : "Sign up here.").font(.callout)
						}).buttonStyle(LinkButtonStyle())
					}
					
					HStack {
						VStack(alignment: .trailing, spacing: 14) {
							Text("Email")
							Text("Password")
							if accountType == .freshRSS {
								Text("API URL")
							}
						}
						VStack(spacing: 8) {
							TextField("me@email.com", text: $model.username)
							SecureField("•••••••••••", text: $model.password)
							if accountType == .freshRSS {
								TextField("https://myfreshrss.rocks", text: $model.apiUrl)
							}
						}
					}
					
					Text("Your username and password will be encrypted and stored in Keychain.")
						.foregroundColor(.secondary)
						.font(.callout)
						.lineLimit(2)
						.padding(.top, 4)
					
					Spacer()
					HStack(spacing: 8) {
						Spacer()
						ProgressView()
							.scaleEffect(CGSize(width: 0.5, height: 0.5))
							.hidden(!model.isAuthenticating)
						Button(action: {
							presentationMode.wrappedValue.dismiss()
						}, label: {
							Text("Cancel")
								.frame(width: 60)
						}).keyboardShortcut(.cancelAction)
						
						Button(action: {
							model.authenticateReaderAccount(accountType)
						}, label: {
							Text("Sign In")
								.frame(width: 60)
						})
						.keyboardShortcut(.defaultAction)
						.disabled(createDisabled())
					}
				}
			}
		}
		.padding()
		.frame(width: 400, height: height())
		.textFieldStyle(RoundedBorderTextFieldStyle())
		.alert(isPresented: $model.showError, content: {
			Alert(title: Text("Sign In Error"), message: Text(model.accountUpdateError.description), dismissButton: .cancel())
		})
		.onReceive(model.$canDismiss, perform: { value in
			if value == true {
				presentationMode.wrappedValue.dismiss()
			}
		})
	}
	#endif
	
	
	
	
	func createDisabled() -> Bool {
		if accountType == .freshRSS {
			return model.username.isEmpty || model.password.isEmpty || !model.apiUrl.mayBeURL
		}
		return model.username.isEmpty || model.password.isEmpty
	}
	
	func height() -> CGFloat {
		if accountType == .freshRSS {
			return 260
		}
		return 230
	}
}

struct AddReaderAPIAccountView_Previews: PreviewProvider {
	static var previews: some View {
		AddReaderAPIAccountView(accountType: .freshRSS)
	}
}
