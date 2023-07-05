//
//  FeedTreeControllerDelegate.swift
//  NetNewsWire
//
//  Created by Brent Simmons on 7/24/16.
//  Copyright © 2016 Ranchero Software, LLC. All rights reserved.
//

import Foundation
import RSTree
import Articles
import Account

final class FeedTreeControllerDelegate: TreeControllerDelegate {

	private var filterExceptions = Set<ItemIdentifier>()
	var isReadFiltered = false
	
	func addFilterException(_ itemID: ItemIdentifier) {
		filterExceptions.insert(itemID)
	}
	
	func resetFilterExceptions() {
		filterExceptions = Set<ItemIdentifier>()
	}
	
	func treeController(treeController: TreeController, childNodesFor node: Node) -> [Node]? {
		if node.isRoot {
			return childNodesForRootNode(node)
		}
		if node.representedObject is Container {
			return childNodesForContainerNode(node)
		}
		if node.representedObject is SmartFeedsController {
			return childNodesForSmartFeeds(node)
		}

		return nil
	}	
}

private extension FeedTreeControllerDelegate {
	
	func childNodesForRootNode(_ rootNode: Node) -> [Node]? {
		var topLevelNodes = [Node]()

		let smartFeedsNode = rootNode.existingOrNewChildNode(with: SmartFeedsController.shared)
		smartFeedsNode.canHaveChildNodes = true
		smartFeedsNode.isGroupItem = true
		topLevelNodes.append(smartFeedsNode)

		topLevelNodes.append(contentsOf: sortedAccountNodes(rootNode))
		
		return topLevelNodes
	}

	func childNodesForSmartFeeds(_ parentNode: Node) -> [Node] {
		return SmartFeedsController.shared.smartFeeds.compactMap { (feed) -> Node? in
			// All Smart Feeds should remain visible despite the Hide Read Feeds setting
			return parentNode.existingOrNewChildNode(with: feed as AnyObject)
		}
	}

	func childNodesForContainerNode(_ containerNode: Node) -> [Node]? {
		let container = containerNode.representedObject as! Container

		var children = [AnyObject]()
		
		for webFeed in container.topLevelFeeds {
			if let itemID = webFeed.itemID, !(!filterExceptions.contains(itemID) && isReadFiltered && webFeed.unreadCount == 0) {
				children.append(webFeed)
			}
		}
		
		if let folders = container.folders {
			for folder in folders {
				if let itemID = folder.itemID, !(!filterExceptions.contains(itemID) && isReadFiltered && folder.unreadCount == 0) {
					children.append(folder)
				}
			}
		}

		var updatedChildNodes = [Node]()

		children.forEach { (representedObject) in

			if let existingNode = containerNode.childNodeRepresentingObject(representedObject) {
				if !updatedChildNodes.contains(existingNode) {
					updatedChildNodes += [existingNode]
					return
				}
			}

			if let newNode = self.createNode(representedObject: representedObject, parent: containerNode) {
				updatedChildNodes += [newNode]
			}
		}

		return updatedChildNodes.sortedAlphabeticallyWithFoldersAtEnd()
	}

	func createNode(representedObject: Any, parent: Node) -> Node? {
		if let webFeed = representedObject as? Feed {
			return createNode(webFeed: webFeed, parent: parent)
		}

		if let folder = representedObject as? Folder {
			return createNode(folder: folder, parent: parent)
		}
		
		if let account = representedObject as? Account {
			return createNode(account: account, parent: parent)
		}

		return nil
	}
	
	func createNode(webFeed: Feed, parent: Node) -> Node {
		return parent.createChildNode(webFeed)
	}
	
	func createNode(folder: Folder, parent: Node) -> Node {
		let node = parent.createChildNode(folder)
		node.canHaveChildNodes = true
		return node
	}

	func createNode(account: Account, parent: Node) -> Node {
		let node = parent.createChildNode(account)
		node.canHaveChildNodes = true
		node.isGroupItem = true
		return node
	}

	func sortedAccountNodes(_ parent: Node) -> [Node] {
		let nodes = AccountManager.shared.sortedActiveAccounts.compactMap { (account) -> Node? in
			let accountNode = parent.existingOrNewChildNode(with: account)
			accountNode.canHaveChildNodes = true
			accountNode.isGroupItem = true
			return accountNode
		}
		return nodes
	}

	func nodeInArrayRepresentingObject(_ nodes: [Node], _ representedObject: AnyObject) -> Node? {
		for oneNode in nodes {
			if oneNode.representedObject === representedObject {
				return oneNode
			}
		}
		return nil
	}
}