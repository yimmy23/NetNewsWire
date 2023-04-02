// Here we are making iframes responsive.  Particularly useful for inline Youtube videos.
function wrapFrames() {
	document.querySelectorAll("iframe").forEach(element => {
		if (element.height > 0 || parseInt(element.style.height) > 0)
			return;
		var wrapper = document.createElement("div");
		wrapper.classList.add("iframeWrap");
		element.parentNode.insertBefore(wrapper, element);
		wrapper.appendChild(element);
	});
}

// Strip out color and font styling

function stripStylesFromElement(element, propertiesToStrip) {
	for (name of propertiesToStrip) {
		element.style.removeProperty(name);
	}
}

// Strip inline styles that could harm readability.
function stripStyles() {
	document.getElementsByTagName("body")[0].querySelectorAll("style, link[rel=stylesheet]").forEach(element => element.remove());
	// Removing "background" and "font" will also remove properties that would be reflected in them, e.g., "background-color" and "font-family"
	document.getElementsByTagName("body")[0].querySelectorAll("[style]").forEach(element => stripStylesFromElement(element, ["color", "background", "font", "max-width", "max-height", "position"]));
}

// Constrain the height of iframes whose heights are defined relative to the document body to be at most
// 50% of the viewport width.
function constrainBodyRelativeIframes() {
	let iframes = document.getElementsByTagName("iframe");

	for (iframe of iframes) {
		if (iframe.offsetParent === document.body) {
			let heightAttribute = iframe.style.height;

			if (/%|vw|vh$/i.test(heightAttribute)) {
				iframe.classList.add("nnw-constrained");
			}
		}
	}
}

// Convert all Feedbin proxy images to be used as src, otherwise change image locations to be absolute if not already
function convertImgSrc() {
	document.querySelectorAll("img").forEach(element => {
		if (element.hasAttribute("data-canonical-src")) {
			element.src = element.getAttribute("data-canonical-src")
		} else if (!/^[a-z]+\:\/\//i.test(element.src)) {
			element.src = new URL(element.src, document.baseURI).href;
		}
	});
}

// Wrap tables in an overflow-x: auto; div
function wrapTables() {
	var tables = document.querySelectorAll("div.articleBody table");

	for (table of tables) {
		var wrapper = document.createElement("div");
		wrapper.className = "nnw-overflow";
		table.parentNode.insertBefore(wrapper, table);
		wrapper.appendChild(table);
	}
}

// Add the playsinline attribute to any HTML5 videos that don"t have it.
// Without this attribute videos may autoplay and take over the whole screen
// on an iphone when viewing an article.
function inlineVideos() {
	document.querySelectorAll("video").forEach(element => {
		element.setAttribute("playsinline", true);
		if (!element.classList.contains("nnwAnimatedGIF")) {
			element.setAttribute("controls", true);
			element.removeAttribute("autoplay");
		}
	});
}

// Remove some children (currently just spans) from pre elements to work around a strange clipping issue
var ElementUnwrapper = {
	unwrapSelector: "span",
	unwrapElement: function (element) {
		var parent = element.parentNode;
		var children = Array.from(element.childNodes);

		for (child of children) {
			parent.insertBefore(child, element);
		}

		parent.removeChild(element);
	},
	// `elements` can be a selector string, an element, or a list of elements
	unwrapAppropriateChildren: function (elements) {
		if (typeof elements[Symbol.iterator] !== 'function')
			elements = [elements];
		else if (typeof elements === "string")
			elements = document.querySelectorAll(elements);

		for (element of elements) {
			for (unwrap of element.querySelectorAll(this.unwrapSelector)) {
				this.unwrapElement(unwrap);
			}

			element.normalize()
		}
	}
};

function flattenPreElements() {
	ElementUnwrapper.unwrapAppropriateChildren("div.articleBody td > pre");
}

function reloadArticleImage(imageSrc) {
	var image = document.getElementById("nnwImageIcon");
	image.src = imageSrc + "?" + new Date().getTime();
}

function stopMediaPlayback() {
	document.querySelectorAll("iframe").forEach(element => {
		var iframeSrc = element.src;
		element.src = iframeSrc;
	});

	// We pause all videos that have controls.  Video without controls shouldn't
	// have sound and are actually converted gifs.  Basically if the user can't
	// start the video again, don't stop it.
	document.querySelectorAll("video, audio").forEach(element => {
		if (element.hasAttribute("controls")) {
			element.pause();
		}
	});
}

function error() {
	document.body.innerHTML = "error";
}

// Takes into account absoluting of URLs.
function isLocalFootnote(target) {
	return target.hash.startsWith("#fn") && target.href.indexOf(document.baseURI) === 0;
}

function styleLocalFootnotes() {
	for (elem of document.querySelectorAll("sup > a[href*='#fn'], sup > div > a[href*='#fn']")) {
		if (isLocalFootnote(elem)) {
			elem.classList.add("footnote");
		}
	}
}

// convert <img alt="📰" src="[...]" class="wp-smiley"> to a text node containing 📰
function removeWpSmiley() {
	for (const img of document.querySelectorAll("img.wp-smiley[alt]")) {
		 img.parentNode.replaceChild(document.createTextNode(img.alt), img);
	}
}

function addYouTubeVideos() {
	const titleURL = document.querySelector(".articleTitle A").getAttribute("href")
	const youTubeLink = "https://www.youtube.com/watch?v="
	if (!titleURL.startsWith(youTubeLink)) {
		return;
	}
	
	// Dynamically add the YouTube frame
	const bodyContainer = document.querySelector("#bodyContainer");
	bodyContainer.setAttribute("style", "position: relative; padding-bottom: 56.25%; height: 100%; overflow: hidden;")
	
	var youTubeFrame = document.createElement("iFrame");
	youTubeFrame.setAttribute("src", "https://www.youtube.com/embed/" + titleURL.substring(youTubeLink.length));
	youTubeFrame.setAttribute("style", "position: absolute; top: 0; left: 0; width: 100%; height: 100%;");
	youTubeFrame.setAttribute("title", "YouTube video player");
	youTubeFrame.setAttribute("frameborder", "0");
	youTubeFrame.setAttribute("allow", "encrypted-media; picture-in-picture; web-share");
	youTubeFrame.setAttribute("allowfullscreen", "true");
	bodyContainer.appendChild(youTubeFrame);
	
	// No YouTube ADS - YouTube https://github.com/GSRHackZ/No-ADS-YouTube
	let ogVolume=1;
	let pbRate = 1;
	
	setInterval(function(){
		if(document.getElementsByClassName("video-stream html5-main-video")[0]!==undefined){
			let ad = document.getElementsByClassName("video-ads ytp-ad-module")[0];
			let vid = document.getElementsByClassName("video-stream html5-main-video")[0];
			if(ad==undefined){
				pbRate = vid.playbackRate;
			}
			let closeAble = document.getElementsByClassName("ytp-ad-overlay-close-button");
			for(let i=0;i<closeAble.length;i++){
				closeAble[i].click();
				//console.log("ad banner closed!")
			}
			if(document.getElementsByClassName("style-scope ytd-watch-next-secondary-results-renderer sparkles-light-cta GoogleActiveViewElement")[0]!==undefined){
				let sideAd=document.getElementsByClassName("style-scope ytd-watch-next-secondary-results-renderer sparkles-light-cta GoogleActiveViewElement")[0];
				sideAd.style.display="none";
				//console.log("side ad removed!")
			}
			if(document.getElementsByClassName("style-scope ytd-item-section-renderer sparkles-light-cta")[0]!==undefined){
				let sideAd_ = document.getElementsByClassName("style-scope ytd-item-section-renderer sparkles-light-cta")[0];
				sideAd_.style.display="none";
				//console.log("side ad removed!")
			}
			if(document.getElementsByClassName("ytp-ad-text ytp-ad-skip-button-text")[0]!==undefined){
				let skipBtn=document.getElementsByClassName("ytp-ad-text ytp-ad-skip-button-text")[0];
				skipBtn.click();
				//console.log("skippable ad skipped!")
			}
			if(document.getElementsByClassName("ytp-ad-message-container")[0]!==undefined){
				let incomingAd=document.getElementsByClassName("ytp-ad-message-container")[0];
				incomingAd.style.display="none";
				//console.log("removed incoming ad alert!")
			}
			if(document.getElementsByClassName("style-scope ytd-companion-slot-renderer")[0]!==undefined){
				document.getElementsByClassName("style-scope ytd-companion-slot-renderer")[0].remove();
				//console.log("side ad removed!")
			}
			if(ad!==undefined){
				if(ad.children.length>0){
					if(document.getElementsByClassName("ytp-ad-text ytp-ad-preview-text")[0]!==undefined){
						vid.playbackRate=16;
						//console.log("Incrementally skipped unskippable ad!")
					}
				}
			}
		}
	},100)
}

function processPage() {
	wrapFrames();
	wrapTables();
	inlineVideos();
	stripStyles();
	constrainBodyRelativeIframes();
	convertImgSrc();
	flattenPreElements();
	styleLocalFootnotes();
	removeWpSmiley();
	addYouTubeVideos();
	postRenderProcessing();
}
