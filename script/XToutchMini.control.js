// --------------------------------------------------------------------------
// ■MCモードのみ動作します
// MCモードのエンコーダーは相対値前提のため、Remote Control操作は
// set() ではなく inc() を基本とします。
// restore も現在値との差分を inc() で送ります。
// --------------------------------------------------------------------------
// ■定数
// 0dBの近似値.
const VOLUME_0DB = 0.795; // 0dBは 0.795が近似値らしい...
// マーカー数は最大64で想定.
const MARKER_COUNT = 64;
// Remote Controlのノブの数 (9以上はエラーとなる).
const KNOB_COUNT = 8;
// ノブの光り方をFANモード (扇形) で上書きする.
const KNOB_LED_FAN_ENABLE = true;
// Remote Controlの値を保存するキー数の上限 (シンプルに実装するためFIFO管理).
const MAX_KNOB_STORE_KEYS = 256;

// MCモードのステータスコード.
const XTOUCH_KNOB_STATUS = 0xB0; // (=176) Ch1 CC (エンコーダーLEDなど)
const XTOUCH_BTN_STATUS = 0x90; // (=144) Ch1 Note On (ボタン押下)
const XTOUCH_BTN_RELEASE_STATUS = 0x80; // (=128) Ch1 Note Off (ボタン離し)

// ノブ番号 (0始まりなので置き換え用の定数).
const KNOB_1 = 0;
const KNOB_2 = 1;
const KNOB_3 = 2;
const KNOB_4 = 3;
const KNOB_5 = 4;
const KNOB_6 = 5;
const KNOB_7 = 6;
const KNOB_8 = 7;

// ボタン(Note番号)の定義 (MCモード仕様に書き換え).
/// 1段目.
const BTN_PLUGIN_WINDOW = 89; // プラグインウィンドウの表示/非表示.
const BTN_POPUP_BROWSER = 90; // ポップアップブラウザの表示.
const BTN_UNUSED_40 = 40; // ※未使用.
const BTN_UNUSED_41 = 41; // ※未使用.
const BTN_SOLO = 42; // 現在のトラックをソロ.
const BTN_MUTE = 43; // 現在のトラックをミュート.
const BTN_FOLLOWING = 44; // 再生ヘッドに追従.
const BTN_RESET_0DB = 45; // 0dBにリセット.

/// 2段目.
const BTN_SHIFT = 87; // MCボタンはSHIFTキーに割り当てる.
const BTN_ALT = 88; // ALTキー
const BTN_REWIND = 91; // 1つ前に移動.
const BTN_FASTFORWARD = 92; // 1つ先に移動.
const BTN_LOOPING = 86; // ループ.
const BTN_STOP = 93; // 停止.
const BTN_PLAYING = 94; // 再生.
const BTN_RECORDING = 95; // 録音.

/// Layer.
const BTN_PREV_TRACK = 84; // 上のトラックに移動.
const BTN_NEXT_TRACK = 85; // 下のトラックに移動.
// --------------------------------------------------------------------------
// ■UUID関連は末尾に移動.
// --------------------------------------------------------------------------
var isPressedShift = false; // SHIFTキーを押しているかどうか.
var isPressedALT = false; // ALTキーを押しているかどうか.

// アプリケーション.
var application;
// transport変数.
var transport;

// トランスポートの状態キャッシュ用.
var isPlaying = false; // 再生中かどうか.
var isLooping = false; // ループ中かどうか.
var isRecording = false; // 録音ボタンが押されているかどうか.
var isFollowing = false; // 追従が有効かどうか.

var pendingShowFollowing = false; // 追従切り替えを表示するかどうか.

// arranger変数.
var arranger;

// cue marker bank変数.
var cueMarkerBank;

// 現在の再生位置キャッシュ.
var currentTransportPos = 0;

// ジャンプ後にマーカー表示を行うフラグ.
var pendingShowMarker = false;

const markerCache = []; // キャッシュ.

// トラック移動時にトラック名表示を行うフラグ.
var pendingShowTrackName = false;

// midi信号をMIDIコントローラ側に送信する.
var midiOut;
// 現在のトラック・デバイス
var cursorTrack; // トラック.
var cursorDevice; // デバイス.
var deviceChain; // デバイスチェイン.

var isSolo = false; // 現在のトラックがソロかどうか.
var isMute = false; // 現在のトラックがミュートかどうか.
var isWindowOpen = false; // プラグインウィンドウの表示状態.

var pendingShowSolo = false; // ソロ切り替えを表示するかどうか.
var pendingShowMute = false; // ミュート切り替えを表示するかどうか.

// Remote Control.
var remotePage;
// ページ切り替えの表示
var pendingShowPageChange = false;
// ノブ初期値.
var knobInitialValues = {};
// Remote Control操作用の情報.
var currentTrackName = ""; // 現在のトラック名.
var currentTrackColor = ""; // 現在のトラックの色.
var currentDeviceName = ""; // 現在のデバイス名.
var currentPageIndex = 0; // ページ番号.
// 現在のノブの値.
var knobCurrentValues = new Array(KNOB_COUNT).fill(0);
// 切り替え直後の保存待ち管理
var pendingContextCapture = false;
var observedMask = 0; // 8bitマスク。各ノブのobserver受信状況を記録
var captureWrittenMask = 0; // キャプチャ済みマスク.
// キーの保存順を管理するキュー.
var knobKeyOrder = [];

// ポップアップブラウザ
var popupBrowser;

// スクリプトのバージョン指定 (v5.xの最新).
loadAPI(20);
// スクリプトのエラーチェックを有効化.
host.setShouldFailOnDeprecatedUse(true);

// 作成者、対応するMIDIコントローラー名、バージョン、UUIDを設定.
host.defineController("Behringer", "X-Touch mini", "1.0", "260ad644-4909-ef58-6a95-73c1c2f9b41c");
// MIDIポートの入力と出力数.
host.defineMidiPorts(1, 1);

// 初期化.
function init() {
  // MIDI信号受け取りのコールバックを設定.
  var midiIn = host.getMidiInPort(0);
  midiIn.setMidiCallback(onMidi);
  
  // midi outを取得.
  midiOut = host.getMidiOutPort(0);
  
  // アプリケーションを生成.
  application = host.createApplication();

  // Transportを生成.
  transport = host.createTransport();
  
  // 再生中の通知.
  transport.isPlaying().addValueObserver(function(b) {
    isPlaying = b;
    updatePlayingLED();
  });

  // 録音中の通知.
  transport.isArrangerRecordEnabled().addValueObserver(function(b) {
    isRecording = b;
    updateRecordingLED();
  });
  
  // ループ中の通知.
  transport.isArrangerLoopEnabled().addValueObserver(function(b) {
    isLooping = b;
    updateLoopingLED();
  });

  // 再生位置をObserverで監視してキャッシュ.
  transport.getPosition().addValueObserver(function(pos) {
    currentTransportPos = pos;

    // ジャンプ後に位置更新が来たタイミングでマーカー名を表示.
    if (pendingShowMarker) {
      pendingShowMarker = false;
      showCurrentMarker();
    }
  });

  // Arrangerを生成.
  arranger = host.createArranger();
  
  // 追従中の通知.
  arranger.isPlaybackFollowEnabled().addValueObserver(function(b) {
    isFollowing = b;
    if(pendingShowFollowing) {
    	// 追従切り替えの表示.
    	host.showPopupNotification("追従モード: " + (b ? "ON" : "OFF"));
    	pendingShowFollowing = false;
    }
    updateFollowingLED();
  });

  // Arrangerから Cue marker bankを生成.
  cueMarkerBank = arranger.createCueMarkerBank(MARKER_COUNT);

  for (var i = 0; i < MARKER_COUNT; i++) {
    markerCache[i] = {
      name: "",
      position: -1
    };

    const marker = cueMarkerBank.getItemAt(i);
    const index = i;

    // 名前取得 (Observerで更新).
    marker.name().addValueObserver(function(name) {
      markerCache[index].name = name;
    });

    // 位置取得 (Observerで更新).
    marker.position().addValueObserver(function(pos) {
      markerCache[index].position = pos;
    });
  }

  // トラック操作.
  cursorTrack = host.createCursorTrack("MyCursorTrack", "MyCursorTrack", 0, 0, true);
  cursorDevice = cursorTrack.createCursorDevice("MyCursorDevice", "MyCursorDevice", 0,
  	CursorDeviceFollowMode.FOLLOW_SELECTION);
  deviceChain = cursorDevice.deviceChain(); // デバイスチェインを取得.
  deviceChain.name().markInterested(); // 名前を取得できるようにする.

  // 現在のトラックの状態をソロ.	
	cursorTrack.solo().addValueObserver(function(b) {
	  isSolo = b;
    if(pendingShowSolo) {
    	// ソロ切り替えの表示.
    	host.showPopupNotification("ソロ: " + (b ? "ON" : "OFF"));
    	pendingShowMute = false;
    }
	  updateSoloLED();
	});

  // 現在のトラックの状態をミュート.
	cursorTrack.mute().addValueObserver(function(b) {
	  isMuted = b;
    if(pendingShowMute) {
    	// ミュート切り替えの表示.
    	host.showPopupNotification("ミュート: " + (b ? "ON" : "OFF"));
    	pendingShowMute = false;
    }
	  updateMuteLED();
	});

  // プラグインウィンドウの表示状態.  
  cursorDevice.isWindowOpen().addValueObserver(function(b) {
    isWindowOpen = b;
    updateWindowOpenLED();
  });
  
  // Remoteページの生成.
  remotePage = cursorDevice.createCursorRemoteControlsPage(8);
	remotePage.pageNames().markInterested(); // ページ名を取得できるようにする.
  
  // ---- トラックの色の監視 ----
  cursorTrack.color().addValueObserver(function(color) {
    currentTrackColor = color ? colorToKey(color) : "";
    markContextChanged();
    tryCapturePendingContext();
  });
  
  // ---- トラック名監視 ----
  cursorTrack.name().addValueObserver(function(name) {
    currentTrackName = name || "";
    if(pendingShowTrackName) {
      // トラック名+デバイス名の表示.
      host.showPopupNotification("[" + currentTrackName + "] " + currentDeviceName);
      pendingShowTrackName = false;
    }
    println("Track changed: " + currentTrackName);
    markContextChanged(); // コンテキスト更新.
    tryCapturePendingContext(); // キャプチャしてみる.
  });

  // ---- デバイス名監視 ----
  cursorDevice.name().addValueObserver(function(name) {
    currentDeviceName = name || "";
    println("Device changed: " + currentDeviceName);
    markContextChanged(); // コンテキスト更新.
    tryCapturePendingContext(); // キャプチャしてみる.
  });
          
  // ---- ページ監視 ----
  if (remotePage.selectedPageIndex) {
    remotePage.selectedPageIndex().addValueObserver(function(pageIndex) {
      currentPageIndex = pageIndex;
      println("Page changed: " + currentPageIndex);
      markContextChanged(); // コンテキスト更新.
      tryCapturePendingContext(); // キャプチャしてみる.

      if(pendingShowPageChange) {
	    	// 情報を表示.
				var idx = remotePage.selectedPageIndex().get();
				println("idx:" + idx);
				var cnt = remotePage.pageCount - 1; // 0始まりなので-1.
				println("cnt:" + cnt);
				var names = remotePage.pageNames().get();
				println("names:" + names);
				host.showPopupNotification("[" + idx + "/" + cnt + "] "
					+ names[idx]
				);
        pendingShowPageChange = false;
      }
    });
  }

	// LEDリング更新処理をバインド
  for(var i = 0; i < KNOB_COUNT; i++) {
    bindRing(i);
  }
  
  // ポップアップブラウザ.
  popupBrowser = host.createPopupBrowser();
  popupBrowser.title().markInterested(); // ブラウザのタイトル名を取得できるようにする.
  
  // 初期化完了メッセージ.
  //host.showPopupNotification("Init: X-Touch mini");
}

// MIDI信号の受け取り.
function onMidi(status, data1, data2) {
  println("MIDI Received - Status: " + status + ", Data1: " + data1 + ", Data2: " + data2);

  // ノートオン (ボタン押下/ノブ押し込み). ベロシティ(data2) > 0 を条件とする
  if(status == 0x90 && data2 > 0) {
    justPressedButton(data1, data2);
  }  
  // ノートオフ または ベロシティ0のノートオン (ボタン離し)
  else if(status == 0x80 || (status == 0x90 && data2 == 0)) {
    justReleasedButton(data1, data2);
  }
  // ノブを回した (MCモードではCC)
  else if(status == 0xB0) {
    justRotateKnow(data1, data2);
  }
  // フェーダーを動かした (MCモードではピッチベンド 0xE0〜0xEF)
  else if(status >= 0xE0 && status <= 0xEF) {
    // ピッチベンドは14bitですが、簡略化のためMSB(data2)を使用します
    var rate = midiToGain(data2);
    setCurrentTrackVolume(rate);
  }
}

// ボタンを押した.
function justPressedButton(data1, data2) {  
  // ノブの押し込み (MCモードでは Note 32〜39)
  if(data1 >= 32 && data1 <= 39) {
    var paramIndex = data1 - 32;
    if(isPressedShift) {
    	// SHIFTキーを押している場合.
    	if(isPopupBrowserOpen()) {
    		// ポップアップブラウザを開いているときは処理しないのが良さそう.
    	}
    	else {
    		// デバイス・プラグインを挿入する.
	    	shiftedKnobPress(paramIndex + 1); // 0始まりを1始まりに変換.
	    	return; // ここで終わり.
    	}
    }
    else if(isPressedALT) {
    	// ALTキーを押している時.
    	if(isPopupBrowserOpen()) {
    		// ポップアップブラウザを開いているときは処理しないのが良さそう.
    	}
    	else {
    		// デバイス・プラグインを挿入する.
	    	altKnobPress(paramIndex + 1); // 0始まりを1始まりに変換.
	    	return; // ここで終わり.
			}
    }
    
    // パラメータのリセット.
    restoreInitialValue(paramIndex);
    
  }
  // 以下はノブ以外のボタン.
  else if(data1 == BTN_PLUGIN_WINDOW) {
  	// プラグインウィンドウの表示.
  	cursorDevice.selectInEditor(); // デバイスを選択してみる.
    cursorDevice.isWindowOpen().toggle();
  }
  else if(data1 == BTN_POPUP_BROWSER) {
  	cursorDevice.selectInEditor(); // デバイスを選択してみる.
  	if(isPopupBrowserOpen()) {
			// 表示されていたら閉じる.
			popupBrowser.cancel();
  	}
  	else {
    	// 表示されていなかったらポップアップブラウザを表示.
      var insertionPoint = cursorDevice.replaceDeviceInsertionPoint();
      insertionPoint.browse();
  	}
  }
  else if(data1 == BTN_SOLO) {
  	// ソロのON/OFF.
  	pendingShowSolo = true; // 切り替えメッセージ表示.
  	cursorTrack.solo().toggle();
  }
  else if(data1 == BTN_MUTE) {
  	// ミュートのON/OFF.
  	pendingShowMute = true; // 切り替えメッセージ表示.
  	cursorTrack.mute().toggle();
  }
  else if(data1 == BTN_FOLLOWING) {
    // 再生ヘッド追従ON/OFF.
  	pendingShowFollowing = true; // 切り替えメッセージ表示.
    arranger.isPlaybackFollowEnabled().toggle();
  }
  else if(data1 == BTN_UNUSED_40) {
  	// 未使用.
  }
  else if(data1 == BTN_UNUSED_41) {
  	// 未使用.
  }
  else if(data1 == BTN_NEXT_TRACK) {
  	if(isPopupBrowserOpen()) {
  		// ポップアップブラウザの場合はコンテンツの選択.
  		popupBrowser.selectNextFile();
  	}
  	else {
	    // そうでなければ次のトラックに移動.
	    pendingShowTrackName = true; // トラック名の表示.
	    cursorTrack.selectNext();
  	}
  }
  else if(data1 == BTN_PREV_TRACK) {
  	if(isPopupBrowserOpen()) {
  		// ポップアップブラウザの場合はコンテンツの選択.
  		popupBrowser.selectPreviousFile();
  	}
  	else {
	    // そうでなければ前のトラックに移動.
	    pendingShowTrackName = true; // トラック名の表示.
	    cursorTrack.selectPrevious();
	  }
  }
  else if(data1 == BTN_RESET_0DB) {
  	if(isPopupBrowserOpen()) {
			// ポップアップブラウザが開いていたらコンテンツを決定する.
			popupBrowser.commit();  		
  	}
  	else {
	    // 現在のトラックの音量を0dBにリセットする.
	    cursorTrack.volume().set(VOLUME_0DB);
	  	host.showPopupNotification("0dBリセット");		
  	}
  }
  else if(data1 == BTN_REWIND) {
    pendingShowMarker = true; // マーカー表示の更新.
    if(isPressedShift) {
    	// SHIFTキーを押していたら、1つ前のキューに移動.
    	transport.jumpToPreviousCueMarker();
    }
    else {
	    // 1つ前に移動.
	    transport.rewind();  	
    }
  }
  else if(data1 == BTN_FASTFORWARD) {
    pendingShowMarker = true; // マーカー表示の更新.
    if(isPressedShift) {
    	// SHIFTを押していたら、次のキューマーカーに再生ヘッドを移動.
	    transport.jumpToNextCueMarker();
    }
    else {
	    // 1つ先に移動.
  	  transport.fastForward();  	
    }
  }
  else if(data1 == BTN_LOOPING) {
    // ループ.
    transport.isArrangerLoopEnabled().toggle();
  }
  else if(data1 == BTN_STOP) {
    // 停止.
    transport.stop();
  }
  else if(data1 == BTN_PLAYING) {
    // 再生 or 停止.
    transport.togglePlay();
  }
  else if(data1 == BTN_RECORDING) {
    // 録音.
    transport.record();
  }
  else if(data1 == BTN_SHIFT) {
  	// MCボタンをSHIFTキーに割り当てる.
  	isPressedShift = true;
  	midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_SHIFT, 127); // 点灯.
  }
  else if(data1 == BTN_ALT) {
  	// ALTキーを押している.
  	isPressedALT = true;
  	midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_ALT, 127); // 点灯.
  }
}

// ボタンを離した. 
function justReleasedButton(data1, data2) {
  // 点灯が消える問題の対処.
  if(data1 == BTN_PLUGIN_WINDOW) {
    updateWindowOpenLED();
  }
  else if(data1 == BTN_SOLO) {
  	updateSoloLED();
  }
  else if(data1 == BTN_MUTE) {
  	updateMuteLED();
  }
  else if(data1 == BTN_FOLLOWING) {
    updateFollowingLED();
  }
  else if(data1 == BTN_LOOPING) {
    updateLoopingLED();
  }
  else if(data1 == BTN_PLAYING) {
    updatePlayingLED();
  }
  else if(data1 == BTN_RECORDING) {
    updateRecordingLED();
  }
  else if(data1 == BTN_SHIFT) {
  	isPressedShift = false;
  	midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_SHIFT, 0); // 消灯.
  }
  else if(data1 == BTN_ALT) {
  	isPressedALT = false;
  	midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_ALT, 0); // 消灯.
  }
}

// ノブを回した.
function justRotateKnow(data1, data2) {
  // MCモードのエンコーダー回転CCは 16〜23.
  // Remote Control 0〜7 に対応させる.
  if (data1 >= 16 && data1 <= 23) {
      var paramIndex = data1 - 16;
      
      // MCモードは「相対値」を出力します
      // 1〜63: 右回転 (プラス), 65〜127: 左回転 (マイナス)
      var increment = 0;
      if (data2 >= 1 && data2 <= 63) { // プラス.
          increment = data2;
      } else if (data2 >= 65 && data2 <= 127) { // マイナス.
          increment = -(data2 - 64);
      }
      
      if(isPressedShift) {
      	// SHIFTキーを押しているときは特殊処理.
      	if(paramIndex == KNOB_8) {
      		shiftedKnob8(increment);
      		return;
      	}
      }
      if(isPopupBrowserOpen()) {
      	// ポップアップブラウザを開いているときは特殊処理.
      	if(paramIndex == KNOB_8) {
      		popupBrowserKnob8(increment);
      		return;
      	}
      }
      
      // inc() を使って現在の値から相対的に増減させる
      remotePage.getParameter(paramIndex).inc(increment, 128);
      
      if(isPressedShift) {
      	// SHIFTを押しているときはリモートコントロールを非表示にする.
      	cursorDevice.isRemoteControlsSectionVisible().set(false);
      }
      else {
      	// SHIFTを押していなかったらリモートコントロールを表示する.
      	cursorDevice.isRemoteControlsSectionVisible().set(true);
      }
  }
}

// SHIFTを押しているときの8番目のノブの挙動.
function shiftedKnob8(v) {
	// 8番目のノブのみ Remote Controlのページ切り替えに割り当てる.
	if(v >= 0) {
    remotePage.selectNextPage(false); // プラスなら次のページ.
	}
	else {
	  remotePage.selectPreviousPage(false); // マイナスは前のページ.
	}
	
	// ページ切り替え表示.
	pendingShowPageChange = true;
}

// ポップアップブラウザを開いているときのノブ8番目の特殊処理.
function popupBrowserKnob8(v) {
	if(v > 0) {
		// プラスのときは前のコンテンツを選択.
		for(var i = 0; i < v; i++) {
			popupBrowser.selectPreviousFile();
		}
	}
	else if(v < 0) {
		// マイナスのときは次のコンテンツを選択.
		for(var i = 0; i < -v; i++) {
			popupBrowser.selectNextFile();
		}
	}
}

// 現在のマーカーの表示.
function showCurrentMarker() {
  var currentPos = currentTransportPos;
  println("currentPos: " + currentPos);

  var currentMarker = null;

  // 再生ヘッドの位置以前で最も近いマーカーを探す.
  for (var i = 0; i < markerCache.length; i++) {
    const m = markerCache[i];
    //println("" + i + ":" + m.name + " - " + m.position);
    
    if (m.position >= 0 && m.position <= currentPos) {
      if (currentMarker == null || m.position > currentMarker.position) {
        currentMarker = m;
      }
    }
  }

  if (currentMarker && currentMarker.name) {
    // マーカー名を表示.
    host.showPopupNotification("Marker: " + currentMarker.name);
    // デバッグ用にログ出力.
    println("Current Marker: " + currentMarker.name);
  }
}

// LEDパラメータ送信.
function sendRingValue(paramIndex, v) {
  var ledCC = 48 + paramIndex;
  var ledValue = getLedValue(v);
  midiOut.sendMidi(XTOUCH_KNOB_STATUS, ledCC, ledValue);
  println("[LED Ring][FORCE] CC:" + ledCC + " Value:" + ledValue + " (v=" + v + ")");
}

// X-Touch MiniのLEDリングの送信.
function bindRing(paramIndex) {
  // MCモードのLEDリング用CCは 48〜55
  var ledCC = 48 + paramIndex;
  
  remotePage.getParameter(paramIndex).value().addValueObserver(128, function(v) {
  	// vは 0〜127.
    knobCurrentValues[paramIndex] = v; // リセット用に値を保存.
    
    // observer受信記録.
    observedMask |= (1 << paramIndex);
    
    // LEDリング反映.
    var ledValue = getLedValue(v); // 変換. 
    midiOut.sendMidi(XTOUCH_KNOB_STATUS, ledCC, ledValue);
    println("[LED Ring] CC:" + ledCC + " Value:" + ledValue);
    
    // 文脈切替後、8個全部そろったら初期値保存
    tryCapturePendingContext();
    
    var allObservedMask = (1 << KNOB_COUNT) - 1;
    if (pendingContextCapture && observedMask === allObservedMask) {
      pendingContextCapture = false; 
      println("Context capture completed: " + makeKnobStoreKey());
    }
  });
}

// v:0〜127を LED用の値に変換する.
function getLedValue(v) {
  var ledValue = 0;
  if(KNOB_LED_FAN_ENABLE) {
    // MCモードのFAN表示: 33(左端1点) 〜 43(全点灯)
    if (v > 0) {
      ledValue = 33 + Math.floor((v / 127) * 10);
    }
  }
  else {
      // DOTモード (MCモードでは 1〜11)
      var ledValue = 0;
      if (v > 0) {
        ledValue = 1 + Math.floor((v / 127) * 10);
      }
  }
  
  return ledValue;
}

// トラック・デバイス・ページを切り替えたフラグの更新.
function markContextChanged() {
    pendingContextCapture = true;
    observedMask = 0;
    captureWrittenMask = 0;
}

// ノブ初期値保存のためのコンテキストの更新.
function tryCapturePendingContext() {
  if (!pendingContextCapture) return;
  if (currentTrackName === "" || currentTrackColor === "" || currentDeviceName === "" || currentPageIndex < 0) return;   
  if (observedMask == 0) return;

  captureObservedParamsAsInitial();
}

// ノブ初期値を保存するためのキーを生成.
function makeKnobStoreKey() {
    return currentTrackName + "::" + currentTrackColor + "::" + currentDeviceName + "::" + currentPageIndex;
}

// packed colorを16進数に変換.
function colorToKey(color) {
  if (color === undefined || color === null) {
  	return "";
  }
  
  // 0〜1 → 0〜255 に丸める.
  // 8bitのパレットカラーのようなのでこれで良いはず...
  var v = Math.round(color * 255);
  
  // hexに変換（2桁）
  var hex = v.toString(16);
  if (hex.length < 2) {
  	hex = "0" + hex;
  }
  return hex;
}

// 保存用ノブの登録数を取得.
function getKnobStoreCount() {
  return knobKeyOrder.length;
}

// スロットの値を保証する.
// 新規キー追加時は、上限を超えたら一番古いキーを削除する.
function ensureSlot(key) {
  if (knobInitialValues[key]) return;
  
  // 上限に達していたら一番古いキーを削除.
  if (knobKeyOrder.length >= MAX_KNOB_STORE_KEYS) {
    var oldestKey = knobKeyOrder.shift();
    if (oldestKey !== undefined) {
      delete knobInitialValues[oldestKey];
      println("Evicted old key: " + oldestKey);
    }
  }
  
  // 未初期化であれば生成.
  knobInitialValues[key] = new Array(KNOB_COUNT);
  for (var i = 0; i < KNOB_COUNT; i++) {
    knobInitialValues[key][i] = null; // null初期化.
  }
  
  // 追加順を記録.
  knobKeyOrder.push(key);
  println("Created new key: " + key + " (total=" + knobKeyOrder.length + ")");
  println("knob store count = " + getKnobStoreCount() + "/" + MAX_KNOB_STORE_KEYS);
}

// 現在スロットの現在値を、そのスロットの初期値として保存.
// 受信済みパラメータのみを処理する.
function captureObservedParamsAsInitial() {
  var key = makeKnobStoreKey();
  ensureSlot(key);

  for (var i = 0; i < KNOB_COUNT; i++) {
    var bit = (1 << i);
    if ((observedMask & bit) !== 0 && (captureWrittenMask & bit) === 0) {
      // 受信済み.
      knobInitialValues[key][i] = knobCurrentValues[i];
      captureWrittenMask |= bit;
    }
  }
  println("Captured observed params: " + key + " mask=" + observedMask);
}

// 押し込み時に、そのページの初期値へ戻す.
function restoreInitialValue(paramIndex) {
  var key = makeKnobStoreKey();
  if (!knobInitialValues[key]) {
    // 存在しなければ何もしない.
    println("No stored initial value for: " + key);
  	return;
  }
  
  var target = knobInitialValues[key][paramIndex];
  if (target === null || target === undefined) {
    // 未設定の値は更新しない.
    println("No stored initial value for: " + key + " / param=" + paramIndex);
  	return;
  }
  
  // 復元処理は絶対値(0〜127)でセットするため、このまま機能します
  //remotePage.getParameter(paramIndex).set(v, 128);

  // Bitwig側へ反映
  // 現在値との差分を使って、inc() 経路で戻す
  var current = knobCurrentValues[paramIndex];
  var delta = target - current;
  
  println("Restore request: param=" + paramIndex
    + " current=" + current
    + " target=" + target
    + " delta=" + delta);

  if (delta !== 0) {
  	remotePage.getParameter(paramIndex).inc(delta, 128);
  }
  
  println("Restored: " + key + " / param=" + paramIndex + " / value=" + target);
}

// 現在のトラックの音量を設定
// @param ratioは0.0〜1.0の想定.
function setCurrentTrackVolume(ratio) {
  if(ratio < 0) { ratio = 0; }
  if(ratio > 1) { ratio = 1; }
  cursorTrack.volume().set(ratio);
}

// midiをGainに変換.
function midiToGain(v) {
  // 分解度は 7bit (0〜127).
  var t = v / 127.0;  
  return t;
}

// LED点灯.
// MCモードではベロシティ127で点灯、0で消灯します
function updatePlayingLED() {
  midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_PLAYING, isPlaying ? 127 : 0);
}
function updateRecordingLED() {
  midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_RECORDING, isRecording ? 127 : 0);
}
function updateLoopingLED() {
  midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_LOOPING, isLooping ? 127 : 0);
}
function updateFollowingLED() {
  midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_FOLLOWING, isFollowing ? 127 : 0);
}
function updateWindowOpenLED() {
  midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_PLUGIN_WINDOW, isWindowOpen ? 127 : 0);
}
function updateMuteLED() {
  midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_MUTE, isMuted ? 127 : 0);
}

function updateSoloLED() {
  midiOut.sendMidi(XTOUCH_BTN_STATUS, BTN_SOLO, isSolo ? 127 : 0);
}

// ポップアップブラウザを開いているかどうか.
function isPopupBrowserOpen() {
	var title = popupBrowser.title().get();
	if(title === null || title === undefined || title == "") {
		return false; // 文字が取得できなかったら開いていないとする.
	}
	// それ以外は開いているとして良さそう.
	return true;
}

function exit() {
  // 終了時の処理
}

// --------------------------------------------------------------------------
// ■UUID関連.
// --------------------------------------------------------------------------
// ■挿入位置
const INSERT_AT_START = "start";
const INSERT_AT_END   = "end";

// ■デバイスタイプ
const DEVICE_TYPE_BITWIG = "bitwig";
const DEVICE_TYPE_VST2   = "vst2";
const DEVICE_TYPE_VST3   = "vst3";
const DEVICE_TYPE_CLAP   = "clap";

// --------------------------------------------------------------------------
// ■UUID / ID
// ◯Bitwig.
const UUID_NOTE_TRANSPOSE = "0815cd9e-3a31-4429-a268-dabd952a3b68"; // 8. Note Transpose.
const UUID_ARPEGGIATOR = "4d407a2b-c91b-4e4c-9a89-c53c19fe6251"; // 8. Arpeggiator.

// ◯外部プラグイン.
const UUID_DUMMY    = "dummy"; // 未割り当て.
/// SHIFT.
const UUID_SYLENTH1 = "56535473796C3173796C656E74683100"; // 1. Sylenth1 (VST3).
const UUID_HIVE2    = "com.u-he.Hive";                    // 2. Hive2 (CLAP).
const UUID_SPIRE    = "2D929CC57005469F9B6744A937E0E8D9"; // 3. Spire (VST3).
const UUID_SERUM2   = "56534558667350736572756D20320000"; // 4. Serum2 (VST3).
const UUID_XPAND2   = "97E9E4584231B468945DA6A5C9A4E249"; // 5. XPand!2 (VST3).
const UUID_SV2      = "ABCDEF019182FAEB44746E6353565332"; // 6. Synthesizer V Studio 2 (VST3).
const UUID_MELODYNE = "5653544D6C70676D656C6F64796E6520"; // 7. Melodyne (VST3).
/// ALT.
const UUID_AVENGER2 = "6B417564564E47435752505241766772"; // 1. VPS Avenger 2 (VST3).
const UUID_VITAL    = "56535456697461766974616C00000000"; // 2. Vital (VST3). CLAP版は不具合がある.
const UUID_TYRELLN6 = "com.u-he.TyrellN6";                // 3. Tyrell-N6 (CLAP).
const UUID_GLITCH2  = 1768385586;                         // 7. Glitch2 (VST2).

// --------------------------------------------------------------------------
// ■SHIFT + ノブ押し込み時の割り当てテーブル
// knobIndex: 1〜8
const SHIFTED_KNOB_PRESS_TABLE = {
  1: {
    name: "Sylenth1",
    type: DEVICE_TYPE_VST3,
    id: UUID_SYLENTH1,
    position: INSERT_AT_END
  },
  2: {
    name: "Hive2",
    type: DEVICE_TYPE_CLAP,
    id: UUID_HIVE2,
    position: INSERT_AT_END
  },
  3: {
    name: "Spire",
    type: DEVICE_TYPE_VST3,
    id: UUID_SPIRE,
    position: INSERT_AT_END
  },
  4: {
    name: "Serum2",
    type: DEVICE_TYPE_VST3,
    id: UUID_SERUM2,
    position: INSERT_AT_END
  },
  5: {
    name: "XPand!2",
    type: DEVICE_TYPE_VST3,
    id: UUID_XPAND2,
    position: INSERT_AT_END
  },
  6: {
    name: "Synthesizer V Studio 2",
    type: DEVICE_TYPE_VST3,
    id: UUID_SV2,
    position: INSERT_AT_END
  },
  7: {
    name: "Melodyne",
    type: DEVICE_TYPE_VST3,
    id: UUID_MELODYNE,
    position: INSERT_AT_END
  },
  8: {
    name: "Note Transpose",
    type: DEVICE_TYPE_BITWIG,
    id: UUID_NOTE_TRANSPOSE,
    position: INSERT_AT_START
  }
};
// --------------------------------------------------------------------------
// ■ALT + ノブ押し込み時の割り当てテーブル
// knobIndex: 1〜8
const ALT_KNOB_PRESS_TABLE = {
  1: {
    name: "VPS Avenger 2",
    type: DEVICE_TYPE_VST3,
    id: UUID_AVENGER2,
    position: INSERT_AT_END
  },
  2: {
    name: "Vital",
    type: DEVICE_TYPE_VST3, // VitalのCLAP版は不具合がある.
    id: UUID_VITAL,
    position: INSERT_AT_END
  },
  3: {
    name: "Tyrell-N6",
    type: DEVICE_TYPE_CLAP,
    id: UUID_TYRELLN6,
    position: INSERT_AT_END
  },
  4: {
    name: "---",
    type: DEVICE_TYPE_VST3,
    id: UUID_DUMMY,
    position: INSERT_AT_END
  },
  5: {
    name: "---",
    type: DEVICE_TYPE_VST3,
    id: UUID_DUMMY,
    position: INSERT_AT_END
  },
  6: {
    name: "---",
    type: DEVICE_TYPE_VST3,
    id: UUID_DUMMY,
    position: INSERT_AT_END
  },
  7: {
    name: "Glitch2",
    type: DEVICE_TYPE_VST2,
    id: UUID_GLITCH2,
    position: INSERT_AT_END
  },
  8: {
    name: "Arpeggiator",
    type: DEVICE_TYPE_BITWIG,
    id: UUID_ARPEGGIATOR,
    position: INSERT_AT_START
  }
};

// --------------------------------------------------------------------------
// 以下UUID・デバイス追加に対する関数.

// ■挿入位置からInsertionPointを取得
function getInsertionPointByPosition(deviceChain, position) {
  if (position === INSERT_AT_START) {
    return deviceChain.startOfDeviceChainInsertionPoint();
  }

  // end を既定値にする
  return deviceChain.endOfDeviceChainInsertionPoint();
}

// --------------------------------------------------------------------------
// ■定義に従ってデバイスを挿入
function insertDeviceByDefinition(deviceChain, definition) {
  if (!definition) {
    println("insertDeviceByDefinition: definition is null");
    return;
  }

  var insertionPoint = getInsertionPointByPosition(deviceChain, definition.position);

  println("Insert Device:");
  println("  name     = " + definition.name);
  println("  type     = " + definition.type);
  println("  id       = " + definition.id);
  println("  position = " + definition.position);

  if (definition.type === DEVICE_TYPE_BITWIG) {
    var deviceUuid = java.util.UUID.fromString(definition.id);
    insertionPoint.insertBitwigDevice(deviceUuid);
    return;
  }

  if (definition.type === DEVICE_TYPE_VST3) {
    insertionPoint.insertVST3Device(definition.id);
    return;
  }

  if (definition.type === DEVICE_TYPE_CLAP) {
    insertionPoint.insertCLAPDevice(definition.id);
    return;
  }

  if (definition.type === DEVICE_TYPE_VST2) {
    insertionPoint.insertVST2Device(definition.id);
    return;
  }

  println("Unknown device type: " + definition.type);
}

// --------------------------------------------------------------------------
// ■SHIFT + ノブ押し込み共通処理
function shiftedKnobPress(knobIndex) {
	// ノブIDXに対応する定義を取得.
  var definition = SHIFTED_KNOB_PRESS_TABLE[knobIndex];
  if (!definition) {
    println("No assignment for knob: " + knobIndex);
    return;
  }

  // デバイス・プラグインを挿入する.
  insertDeviceByDefinition(deviceChain, definition);
}

// ■ALT + ノブ押し込み共通処理
function altKnobPress(knobIndex) {
	// ノブIDXに対応する定義を取得.
  var definition = ALT_KNOB_PRESS_TABLE[knobIndex];
  if (!definition) {
    println("No assignment for knob: " + knobIndex);
    return;
  }

  // デバイス・プラグインを挿入する.
  insertDeviceByDefinition(deviceChain, definition);
}
