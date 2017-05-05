// ==UserScript==
// @name           Morser #BAD
// @version        0.1.13
// @namespace      Morser@Byzod.UC.js
// @author         Byzod
// @description    Encord/Decode with Morser coding
// ==/UserScript==


/**Morse to words, words to Morse**/
/**Copyright 2012 by Byzod <Byzzod@gmail.com>**/

/** 速度和声音大小更改在159和160行 **/
/** 弹出框样式更改在408行 **/

/*
  A 	.- 		B 	-... 	C 	-.-. 	D 	-.. 	E 	. 		F 	..-. 	G 	--.
  H 	.... 	I 	.. 		J 	.--- 	K 	-.- 	L 	.-.. 	M 	-- 		N 	-.
  O 	--- 	P 	.--. 	Q 	--.- 	R 	.-. 	S 	... 	T 	- 		U 	..-
  V 	...- 	W 	.-- 	X 	-..- 	Y 	-.-- 	Z 	--..
  
  1 	.---- 	2 	..--- 	3 	...-- 	4 	....- 	5 	.....
  6 	-.... 	7 	--... 	8 	---.. 	9 	----. 	0 	-----
  or
  1 	.- 		2 	..- 	3 	...-- 	4 	....- 	5 	.
  6 	-.... 	7 	-... 	8 	-.. 	9 	-. 		0 	-
  
  句号（.） 	.-.-.- 	冒号（:） 		---... 	逗号（,） 	--..-- 		分号（;） 	-.-.-.
  问号（?） 	..--.. 	等号（=） 		-...- 	单引号（'） .----. 		斜线（/） 	-..-.
  感叹号（!） 	-.-.-- 	连字号（-） 	-....- 	下劃线（_） ..-- .- 	双引号（"） .-..-.
  前括号（(） 	-.--. 	后括号（)） 	-.--.- 	美元（$） 	...-..- 	& 			. ...
  @ 			.--.-.
  
  ä或æ 	.-.- 	à或å 	.--.- 	ç或ĉ 	-.-.. 	ch 	---- 	ð 		..--.
  è 	.-..- 	é 		..-.. 	ĝ 		--.-. 	ĥ 	-.--. 	ĵ 		.---.
  ñ 	--.-- 	ö或ø 	---. 	ŝ 		...-. 	þ 	.--.. 	ü或ŭ 	..--
  
*/

/* 
 * RIFFWAVE.js v0.03 - Audio encoder for HTML5 <audio> elements.
 * Copyleft 2011 by Pedro Ladaria <pedro.ladaria at Gmail dot com>
 *
 * Public Domain
 *
 * Changelog:
 *
 * 0.01 - First release
 * 0.02 - New faster base64 encoding
 * 0.03 - Support for 16bit samples
 *
 * Notes:
 *
 * 8 bit data is unsigned: 0..255
 * 16 bit data is signed: −32,768..32,767
 *
 */
var FastBase64 = {
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encLookup: [],
    Init: function() {
        for (var i=0; i<4096; i++) {
            this.encLookup[i] = this.chars[i >> 6] + this.chars[i & 0x3F];
        }
    },
    Encode: function(src) {
        var len = src.length;
        var dst = '';
        var i = 0;
        while (len > 2) {
            n = (src[i] << 16) | (src[i+1]<<8) | src[i+2];
            dst+= this.encLookup[n >> 12] + this.encLookup[n & 0xFFF];
            len-= 3;
            i+= 3;
        }
        if (len > 0) {
            var n1= (src[i] & 0xFC) >> 2;
            var n2= (src[i] & 0x03) << 4;
            if (len > 1) n2 |= (src[++i] & 0xF0) >> 4;
            dst+= this.chars[n1];
            dst+= this.chars[n2];
            if (len == 2) {
                var n3= (src[i++] & 0x0F) << 2;
                n3 |= (src[i] & 0xC0) >> 6;
                dst+= this.chars[n3];
            }
            if (len == 1) dst+= '=';
            dst+= '=';
        }
        return dst;
    } // end Encode
}
FastBase64.Init();
var RIFFWAVE = function(data) {

    this.data = [];        // Array containing audio samples
    this.wav = [];         // Array containing the generated wave file
    this.dataURI = '';     // http://en.wikipedia.org/wiki/Data_URI_scheme

    this.header = {                         // OFFS SIZE NOTES
        chunkId      : [0x52,0x49,0x46,0x46], // 0    4    "RIFF" = 0x52494646
        chunkSize    : 0,                     // 4    4    36+SubChunk2Size = 4+(8+SubChunk1Size)+(8+SubChunk2Size)
        format       : [0x57,0x41,0x56,0x45], // 8    4    "WAVE" = 0x57415645
        subChunk1Id  : [0x66,0x6d,0x74,0x20], // 12   4    "fmt " = 0x666d7420
        subChunk1Size: 16,                    // 16   4    16 for PCM
        audioFormat  : 1,                     // 20   2    PCM = 1
        numChannels  : 1,                     // 22   2    Mono = 1, Stereo = 2...
        sampleRate   : 8000,                  // 24   4    8000, 44100...
        byteRate     : 0,                     // 28   4    SampleRate*NumChannels*BitsPerSample/8
        blockAlign   : 0,                     // 32   2    NumChannels*BitsPerSample/8
        bitsPerSample: 8,                     // 34   2    8 bits = 8, 16 bits = 16
        subChunk2Id  : [0x64,0x61,0x74,0x61], // 36   4    "data" = 0x64617461
        subChunk2Size: 0                      // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
    };

    function u32ToArray(i) {
        return [i&0xFF, (i>>8)&0xFF, (i>>16)&0xFF, (i>>24)&0xFF];
    }

    function u16ToArray(i) {
        return [i&0xFF, (i>>8)&0xFF];
    }

    function split16bitArray(data) {
        var r = [];
        var j = 0;
        var len = data.length;
        for (var i=0; i<len; i++) {
            r[j++] = data[i] & 0xFF;
            r[j++] = (data[i]>>8) & 0xFF;
        }
        return r;
    }

    this.Make = function(data) {
        if (data instanceof Array) this.data = data;
        this.header.blockAlign = (this.header.numChannels * this.header.bitsPerSample) >> 3;
        this.header.byteRate = this.header.blockAlign * this.header.sampleRate;
        this.header.subChunk2Size = this.data.length * (this.header.bitsPerSample >> 3);
        this.header.chunkSize = 36 + this.header.subChunk2Size;

        this.wav = this.header.chunkId.concat(
            u32ToArray(this.header.chunkSize),
            this.header.format,
            this.header.subChunk1Id,
            u32ToArray(this.header.subChunk1Size),
            u16ToArray(this.header.audioFormat),
            u16ToArray(this.header.numChannels),
            u32ToArray(this.header.sampleRate),
            u32ToArray(this.header.byteRate),
            u16ToArray(this.header.blockAlign),
            u16ToArray(this.header.bitsPerSample),    
            this.header.subChunk2Id,
            u32ToArray(this.header.subChunk2Size),
            (this.header.bitsPerSample == 16) ? split16bitArray(this.data) : this.data
        );
        this.dataURI = 'data:audio/wav;base64,'+FastBase64.Encode(this.wav);
    };

    if (data instanceof Array) this.Make(data);

}; // end RIFFWAVE



var Morser={
	Dit:[], // Yes, just an array, dude
	Dah:[],
	Gap:[],
	morseAudio:{}, // The Audio object to play
	Volume:0.5, //Playback volume
	WPM:15, //Word per minute, milliseconds per dot = 1200/WPM
	__Map:{
		" " : "  ",
		"A" : ".-",
		"a" : ".-",
		"B" : "-...",
		"b" : "-...",
		"C" : "-.-.",
		"c" : "-.-.",
		"D" : "-..",
		"d" : "-..",
		"E" : ".",
		"e" : ".",
		"F" : "..-.",
		"f" : "..-.",
		"G" : "--.",
		"g" : "--.",
		"H" : "....",
		"h" : "....",
		"I" : "..",
		"i" : "..",
		"J" : ".---",
		"j" : ".---",
		"K" : "-.-",
		"k" : "-.-",
		"L" : ".-..",
		"l" : ".-..",
		"M" : "--",
		"m" : "--",
		"N" : "-.",
		"n" : "-.",
		"O" : "---",
		"o" : "---",
		"P" : ".--.",
		"p" : ".--.",
		"Q" : "--.-",
		"q" : "--.-",
		"R" : ".-.",
		"r" : ".-.",
		"S" : "...",
		"s" : "...",
		"T" : "-",
		"t" : "-",
		"U" : "..-",
		"u" : "..-",
		"V" : "...-",
		"v" : "...-",
		"W" : ".--",
		"w" : ".--",
		"X" : "-..-",
		"x" : "-..-",
		"Y" : "-.--",
		"y" : "-.--",
		"Z" : "--..",
		"z" : "--..",

		"1" : ".----",
		"2" : "..---",
		"3" : "...--",
		"4" : "....-",
		"5" : ".....",
		"6" : "-....",
		"7" : "--...",
		"8" : "---..",
		"9" : "----.",
		"0" : "-----",

		"." : ".-.-.-",
		":" : "---...",
		"," : "--..--",
		";" : "-.-.-.",
		"?" : "..--..",
		"=" : "-...-",
		"'" : ".----.",
		"/" : "-..-.",
		"!" : "-.-.--",
		"-" : "-....-",
		"_" : "..--.-",
		"\"" : ".-..-.",
		"(" : "-.--.",
		")" : "-.--.-",
		"$" : "...-..-",
		"&" : ".—...",
		"@" : ".--.-.",

		"ä" : ".-.-",
		"æ" : ".-.-",
		"à" : ".--.-",
		"å" : ".--.-",
		"ç" : "-.-..",
		"ĉ" : "-.-..",
		"ð" : "..--.",
		"è" : ".-..-",
		"é" : "..-..",
		"ĝ" : "--.-.",
		"ĥ" : "-.--.",
		"ĵ" : ".---.",
		"ñ" : "--.--",
		"ö" : "---.",
		"ø" : "---.",
		"ŝ" : "...-.",
		"þ" : ".--..",
		"ü" : "..--",
		"ŭ" : "..--",
		
		"(STOP)" : ".-.-.",
		"(WAIT)" : ".-...",
		"(BREAK)" : "-...-.-",
		"(CLEAR)" : "-.-..-..",
		"(COPY THIS)" : "-.-.-",
		"(WUBUN)" : "-..---",
		"(END)" : "...-.-",
		"(ERROR)" : "........",
		"(SOS)" : "...---...",
	},
	init:function(){
		var i=0;
		//80ms per dit at 15 WPM. T = 1200/W, W is speed in WPM, unit: ms
		for (i=0; i<9600/Morser.WPM; i++) Morser.Dit[i] = 128 + 127 * Math.sin(i * 0.7853426506);  //1273.239545 * 0.785=1kHz @ 8kHz sample rate
		for (i=0; i<28800/Morser.WPM; i++) Morser.Dah[i] = 128 + 127 * Math.sin(i * 0.7853426506);
		for (i=0; i<9600/Morser.WPM; i++) Morser.Gap[i] = 127; //nop
		Morser.morseAudio = new Audio();
	},
	GetKeyByValue : function( value , object) {
		for( var prop in object ) {
			if( object.hasOwnProperty( prop ) ) {
				if( object[ prop ] === value )
					return prop;
			}
		}
	},
	//Encode string to morse codes
	Encode:function(str){
		var i = 0;
		var codemap = "";
		var mcode = ""
		if(str != null && str.length > 0){
			str = str.replace(/\s/g, " ");
			for(i=0;i<str.length;i++){
				codemap = Morser.__Map[str[i]];
				if(codemap != undefined){
					if(i===0 || str[i-1] === " "){
						mcode = mcode.concat(codemap);
					}else{
						mcode = mcode.concat(" ").concat(codemap);
					}
				}
			}
		}
		return mcode;
	},
	//Decode morse codes to string
	Decode:function(mcode){
		var i = 0;
		var chara = "";
		var str = "";
		var mcodeChars = {};
		var mcodeRegx = new RegExp();
		//3个及3个以上空格作为分词符
		mcodeRegx.compile("([.-]+|\\s{3,})","g");
		if(mcode!=null && mcode.length > 0){
			mcodeChars = mcode.match(mcodeRegx);
			for (i=0;i < mcodeChars.length ; i++){
				//3个及3个以上空格作为分词符
				if(/\s{3,}/.test(mcodeChars[i])){
					str = str.concat(" ");
				}else{
					chara = Morser.GetKeyByValue(mcodeChars[i], Morser.__Map);
					if(chara != undefined){
						str = str.concat(chara);
					}
				}
			}
		}
		return str;
	},
	//make audio, data URI is in Morser.morseAudio
	MakeAudio:function(mcode){
		if(mcode != null){
			var wavData = [];
			for(var i = 0; i < mcode.length; i++){
				switch(mcode[i]){
					case ".":
						wavData = wavData.concat(Morser.Dit).concat(Morser.Gap);
						break;
					case "-":
						wavData = wavData.concat(Morser.Dah).concat(Morser.Gap);
						break;
					case " ": //dot gap = 1 dit length; letter gap = 3 dit length; word gap = 7 dit length
						if(i < mcode.length - 1 && mcode[i+1] != " "){ //letter gap x3
							wavData = wavData.concat(Morser.Gap).concat(Morser.Gap).concat(Morser.Gap);
						}else if(i < mcode.length - 3 && mcode.substr(i,3) === "   "){ //word gap x7
							wavData = wavData.concat(Morser.Gap).concat(Morser.Gap).concat(Morser.Gap)
								.concat(Morser.Gap).concat(Morser.Gap).concat(Morser.Gap).concat(Morser.Gap);
						}
						break;
					default:
						break;
				}
			}
			Morser.morseAudio.volume = Morser.Volume;
			var wave = new RIFFWAVE(wavData); // create the wave file
			Morser.morseAudio.src = wave.dataURI; // create the HTML5 audio element
		}
	},
	//Play sound in WAV format with HTML5. IE can't play that, poor boy
	PlayMorseCode:function(mcode){
		Morser.MakeAudio(mcode);
		Morser.morseAudio.play(); 
	},
	//Shortcut for play sound directly from string
	EncodeAndPlay:function(str){
		var mcode = "";
		mcode = Morser.Encode(str)
		Morser.PlayMorseCode(mcode);
		return mcode;
	}
}

/**convert to HTML format**/
String.prototype.toHTMLEncode = function(){
	var str = this;
	str=str.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
		.replace(/\'/g,"&apos;")
		.replace(/\"/g,"&quot;")
		.replace(/\n/g,"<br>")
		.replace(/ /g,"&nbsp;")
		.replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;");
	return str;
}

//GUI and helper functions
var MorserHelper = {
	mCode:{}, //Store encoded/selected morse code
	mItem:{}, //Root context menu
	mSelection:"", //Store selected text
	canGetSelection:true, //Indicate that use selectionStart/End or getSelection
	//handle sub menu functions
	Pop:function(e){
		var hasPopBox = content.document.getElementById('morserBox')!==null;
		var morserBox = {};
		if( !hasPopBox ){
			morserBox = content.document.createElement("div");
			morserBox.id = "morserBox";
			morserBox.className = "morserBox";
			morserBox.style.border = "2px double #FFFFFF";
			morserBox.style.borderRadius = ".7em .7em .7em .7em";
			morserBox.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
			morserBox.style.boxShadow = "0 0 0.2em 0.1em rgba(0, 0, 0, 0.7)";
			morserBox.style.color = "white";
			morserBox.style.fontSize = "20px";
			morserBox.style.overflow = "auto";
			morserBox.style.maxWidth = "30em";
			morserBox.style.maxHeight = "12em";
			morserBox.style.padding = "0.5em";
			morserBox.style.textShadow = "0.5px 0.5px 3px #000000";
			morserBox.style.zIndex = "37777";
			morserBox.style.position = "fixed";
		}else{
			morserBox = content.document.getElementById('morserBox');
		}
		morserBox.style.top = (e.clientY - 100) + "px";
		morserBox.style.left = (e.clientX - 40) + "px";
		Morser.mCode = null;
		switch (e.target.id){
			case "context-morserEncode":
				var mcode = Morser.Encode(MorserHelper.mSelection);
				if(mcode!=null && mcode.length > 0){
					Morser.mCode = mcode;
					morserBox.innerHTML = "<button class='morserBox morserBtn' rel=Select>复制</button>"
										+ "<button class='morserBox morserBtn' rel=Play>播放</button>"
										+ "<div id=mcode class=morserBox style='word-break:break-all'>" + mcode.toHTMLEncode() + "</div>";
				}
				break;
			case "context-morserEncodeAndPlay":
				var mcode = Morser.EncodeAndPlay(MorserHelper.mSelection);
				if(mcode!=null && mcode.length > 0){
					Morser.mCode = mcode;
					morserBox.innerHTML = "<button class='morserBox morserBtn' rel=Select>复制</button>"
										+ "<button class='morserBox morserBtn' rel=Play>播放</button>"
										+ "<div id=mcode class=morserBox style='word-break:break-all'>" + mcode.toHTMLEncode() + "</div>";
				}
				break;
			case "context-morserEncodeAndSave":
				var mcode = Morser.Encode(MorserHelper.mSelection);
				if(mcode!=null && mcode.length > 0){
					Morser.mCode = mcode;
					morserBox.innerHTML = "<button class='morserBox morserBtn' rel=Select>复制</button>"
										+ "<button class='morserBox morserBtn' rel=Play>播放</button>"
										+ "<div id=mcode class=morserBox style='word-break:break-all'>" + mcode.toHTMLEncode() + "</div>";
					Morser.MakeAudio(mcode);
					let tDate = new Date()
					let timeStr = ""
					timeStr += tDate.getFullYear() + "-" + tDate.getMonth() + "-" + tDate.getDay() + "-"
								+ tDate.getHours() + tDate.getMinutes() + tDate.getSeconds() + "." + tDate.getMilliseconds()
								+ ".wav";
					saveURL(Morser.morseAudio.src, "MorserCode_" + timeStr, null, null, null, null, document);
				}
				break;
			case "context-morserDecode":
				var str = Morser.Decode(MorserHelper.mSelection).replace(/\s/g, "\xA0");
				if(str!=null && str.length > 0){
					Morser.mCode = MorserHelper.mSelection;
					morserBox.innerHTML = "<button class='morserBox morserBtn' rel=Select>复制</button>"
										+ "<button class='morserBox morserBtn' rel=PlaySelect>播放</button>"
										+ "<div id=mcode class=morserBox style='word-break:break-all'>" + str.toHTMLEncode() + "</div>";
				}
				break;
			case "context-morserPlay":
				MorserHelper.Play(MorserHelper.mSelection);
				morserBox.innerHTML = "";
				break;
			default:
				break;
		}
		if(morserBox != null && Morser.mCode!=null && Morser.mCode.length > 0){
			if( !hasPopBox ){
				content.document.body.appendChild(morserBox);
			}else{
				content.document.getElementById('morserBox').style.display = "block";
			}
			var Btns = content.document.getElementsByClassName('morserBtn')
			for (var i = 0; i < Btns.length; i++){
				Btns[i].addEventListener('mousedown', MorserHelper.BtnsHandler, false);
			}
		}
	},
	//handle alert box buttons' function
	BtnsHandler:function(e){
		var rel = e.target.getAttribute("rel");
		var mcode = content.document.getElementById('mcode');
		switch(rel){
			case "Select":
				MorserHelper.Select(mcode);
				break;
			case "Play":
				MorserHelper.Play(mcode.textContent.toString().replace(/\s/g, " "));
				break;
			case "PlaySelect":
				MorserHelper.Play(MorserHelper.mSelection);
				break;
			default:
				break;
		}
	},
	//Select mcode
	Select:function(mcode){
		var textNode = mcode.firstChild;
		var theRange = document.createRange();
		theRange.selectNode(textNode);
		content.window.getSelection().removeAllRanges();
		content.window.getSelection().addRange(theRange);
		var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(Morser.mCode);
	},
	//play mcode
	Play:function(mcode){
		Morser.PlayMorseCode(mcode);
	},
	//Fucking input and textarea handler
	__FIATH:function(e){
		if(e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT"){
			MorserHelper.canGetSelection = false;
			if(e.target.value.substr(e.target.selectionStart, e.target.selectionEnd).length > 0){
				MorserHelper.mItem.hidden = false;
				MorserHelper.mSelection = e.target.value.substr(e.target.selectionStart, e.target.selectionEnd - e.target.selectionStart);
			}else{
				MorserHelper.mItem.hidden = true;
			}
		}else{
			MorserHelper.canGetSelection = true;
		}
	},
	init: function(){
		Morser.init();
		
		MorserHelper.mItem = document.createElement("menu");
		MorserHelper.mItem.setAttribute("id", "context-morser");
		MorserHelper.mItem.setAttribute("label", "Morser:将选中文字...");
		MorserHelper.mItem.setAttribute("accesskey", "M");
		// Encode
		var mItemEncode = document.createElement("menuitem");
		mItemEncode.setAttribute("id", "context-morserEncode");
		mItemEncode.setAttribute("label", "编码为Morse码");
		mItemEncode.addEventListener('mouseup', MorserHelper.Pop, false);
		// EncodeAndPlay
		var mItemEncodeAndPlay = document.createElement("menuitem");
		mItemEncodeAndPlay.setAttribute("id", "context-morserEncodeAndPlay");
		mItemEncodeAndPlay.setAttribute("label", "编码为Morse码并播放");
		mItemEncodeAndPlay.addEventListener('mouseup', MorserHelper.Pop, false);
		// EncodeAndSave
		var mItemEncodeAndSave = document.createElement("menuitem");
		mItemEncodeAndSave.setAttribute("id", "context-morserEncodeAndSave");
		mItemEncodeAndSave.setAttribute("label", "编码为Morse码并保存");
		mItemEncodeAndSave.addEventListener('mouseup', MorserHelper.Pop, false);
		// Decode
		var mItemDecode = document.createElement("menuitem");
		mItemDecode.setAttribute("id", "context-morserDecode");
		mItemDecode.setAttribute("label", "当做Morse码解码");
		mItemDecode.addEventListener('mouseup', MorserHelper.Pop, false);
		// Play
		var mItemPlay = document.createElement("menuitem");
		mItemPlay.setAttribute("id", "context-morserPlay");
		mItemPlay.setAttribute("label", "当做Morse码播放");
		mItemPlay.addEventListener('mouseup', MorserHelper.Pop, false);
		//add to root menu
		var morserPopUp = MorserHelper.mItem.appendChild(document.createElement("menupopup"));
		morserPopUp.setAttribute("id", "morserMenuPopUp");
		morserPopUp.appendChild(mItemEncode);
		morserPopUp.appendChild(mItemEncodeAndPlay);
		morserPopUp.appendChild(mItemEncodeAndSave);
		morserPopUp.appendChild(mItemDecode);
		morserPopUp.appendChild(mItemPlay);
		//add to context menu
		var contextMenu = document.getElementById("contentAreaContextMenu");
		contextMenu.insertBefore(MorserHelper.mItem, document.getElementById("context-copy"));
		
		document.getElementById("contentAreaContextMenu").addEventListener(
				"popupshowing", 
				function(){ 
					MorserHelper.onPopupShowing(this);
				}, 
				false
		);
		
		window.addEventListener('mousedown',
		function closePop(e){
			if(!(/\bmorserBox\b/i.test(e.target.className))){
				window.removeEventListener('mouseup',closePop,false);
				let mBox = content.document.getElementById('morserBox');
				if(mBox!=null)mBox.style.display = "none";
			}
		}, false);
		window.addEventListener('mouseup', MorserHelper.__FIATH, false);
	},
	onPopupShowing: function(aPopup){
		if(MorserHelper.canGetSelection == true){
			var selection = content.window.getSelection().toString();
			if(selection!=null && selection.length > 0){
				MorserHelper.mItem.hidden = false;
				MorserHelper.mSelection = selection;
			}else{
				MorserHelper.mItem.hidden = true;
			}
		}
	}
}
window.setTimeout( MorserHelper.init, 100 );