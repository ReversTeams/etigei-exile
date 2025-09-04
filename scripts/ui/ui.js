const linkButton = url => () => {
	if (!Core.app.openURI(url)) {
		Vars.ui.showErrorMessage("@linkfail");
		Core.app.setClipboardText(url);
	}
};

// Updater
let updateText = "@etigeox.news.update"
let buttonUpdateText = ""
let updateButtonSize = {
	width: 60,
	height: 60
}

const UpdateChecker = () => {
	let updateAvailable = false;
	let updateBuild;

	const buttons = [];

	const init = res => {
		checkUpdate(() => {

			if (updateAvailable) {
				updateText = "@etigeox.news.update.available";
				buttonUpdateText = "@etigeox.news.update.available";
				updateButtonSize = {
					width: 200,
					height: 60
				}
			};

			Vars.ui.menuGroup["fill(arc.func.Cons)"](c => {
				c.bottom().left();
				const updateButton = c.button(buttonUpdateText, Icon.refresh, () => checkUpdateGUI())
					.size(updateButtonSize.width, updateButtonSize.height)
					.padLeft(60);

				addButton(updateButton);
			});

			if (res) res();
			paintButtons();
		});
	};

	const paintButtons = () => {
		if (!updateAvailable) return;
		buttons.forEach(btn => {
			btn.get().setColor(255, 0, 0, 1);
		});
	};

	const addButton = btn => {
		buttons.push(btn);
		return btn;
	};

	const checkUpdate = res => {
		Vars.ui.loadfrag.show();
		Http.get("https://raw.githubusercontent.com/Lysent/etigei-exile/refs/heads/main/mod.json")
			.error(e => {
				Vars.ui.loadfrag.hide();
				res(false);
			})
			.submit(res => {
				Vars.ui.loadfrag.hide();

				const json = JSON.parse(res.getResultAsString());
				const version = json.version;
				if (version === Vars.mods.getMod("etigeox").meta.version) {
					res(false);
				} else {
					updateAvailable = true;
					updateBuild = version;
					res(true);
				}
			});
	};

	const checkUpdateGUI = () => {
		if (!updateAvailable) {
			Vars.ui.showInfo("@be.noupdates");
		} else {
			showUpdateDialog();
		}
	};

	const showUpdateDialog = () => {
		Vars.ui.showCustomConfirm(
			Core.bundle.format("etigeox.update", updateBuild), "@etigeox.update.description",
			"@ok", "@cancel",
			() => {
				Vars.ui.mods.githubImportMod("Lysent/etigei-exile", false);
				updateAvailable = false;
			},
			() => { }
		);
	};

	return {
		init: init,
		paintButtons: paintButtons,
		addButton: addButton,
		checkUpdate: checkUpdate,
		checkUpdateGUI: checkUpdateGUI,
		showUpdateDialog: showUpdateDialog
	}
}

// Startup UI
const NewsDialog = () => {
	let dialog, news, checker;

	const mod = Vars.mods.getMod("etigeox");

	const
		urlNews = "https://raw.githubusercontent.com/Lysent/etigei-exile/refs/heads/main/news/" + Core.bundle.get("etigeox.news.file"),
		urlDiscord = "https://discord.com/invite/TJKZgr6UDg",
		urlWiki = "https://revers.fandom.com/wiki/Revers_Wiki",
		urlGithub = "https://github.com/Lysent/etigei-exile";

	const load = () => {
		dialog = new BaseDialog(Core.bundle.format("etigeox.news.title", mod.meta.version));

		dialog.addCloseListener();

		MapButton();
		AddonsButton();
		MainMenu();
		checker = UpdateChecker();
		checker.init();

		news = getNews();

		onResize(() => {
			dialog.cont.clear();
			loadBody(news);
			loadStar();
			loadButtons();
		});

		dialog.show();
	};

	const MainMenu = () => {
		Vars.ui.menuGroup["fill(arc.func.Cons)"](c => {
			c.bottom().left();
			c.button(Icon.list, () => {
				dialog.show();
			}).size(60, 60);
		});
	};

	const loadBody = (news) => {
		dialog.cont.image(Core.atlas.find("etigeox-banner", Core.atlas.find("clear")))
			.height(Vars.mobile ? 144 : 185).width(Vars.mobile ? 480 : 620).pad(3).center()
			.row();

		dialog.cont.pane(news).width(Vars.mobile ? 480 : 600)
			.maxWidth(Vars.mobile ? 480 : 600).pad(4);
	};

	const loadStar = () => {
		dialog.cont.row();
		dialog.cont["table(arc.func.Cons)"](t => {
			t.defaults().size(152 * 4, 42).pad(3);
			t.button("Please star the mod on GitHub if you've enjoyed", Icon.star, linkButton(urlGithub));
		}).center().fillX();
	};

	const loadButtons = () => {
		if (true || !(Vars.mobile && !Core.graphics.isPortrait())) {
			dialog.cont.row();

			dialog.cont["table(arc.func.Cons)"](t => {
				t.defaults().size(148, 72).pad(3);

				t.button("Discord", Icon.discord, linkButton(urlDiscord));
				t.button("Wiki", Icon.book, linkButton(urlWiki));
				t.button("GitHub", Icon.githubSquare, linkButton(urlGithub));
				checker.addButton(
					t.button(updateText, Icon.download, () => checker.checkUpdateGUI())
				).row();
				checker.paintButtons();
			}).center().fillX().row();
			dialog.cont["table(arc.func.Cons)"](t => {
				t.defaults().size(128 * 4, 64).pad(3);
				t.button("@close", Icon.cancel, () => dialog.hide());
			}).center().fillX();
		} else { // If on landscape mobile

		}
	};

	const getNews = () => {
		const table = new Table();
		Log.info("[etigeox][lightgray] Fetching news...");

		Http.get(urlNews).error(err => {
			table.add("[red][ERROR] FAILED TO GET NEWS.").center();
			Log.err("[red][Etigeox][lightgray] " + err.getMessage());
		}).block(res => {
			table.add(res.getResultAsString()).left().growX().wrap().labelAlign(Align.left);
		});

		return table;
	};

	const onResize = cb => {
		Events.on(ResizeEvent, event => {
			if (dialog.isShown() && Core.scene.getDialog() == dialog) {
				cb();
				dialog.updateScrollFocus();
			}
		});
	};

	return {
		load: load
	};
};

// Map UI
const MapButton = () => {
	Vars.ui.menuGroup["fill(arc.func.Cons)"](c => {
		c.bottom().left();
		c.button(Icon.terrain, () => {
			MapDialog();
		}).size(60, 60).padBottom(60);
	});
}

const MapDialog = (mapname, dim) => {
	const SectorDialog = new BaseDialog(Core.bundle.format("etigeox.map.title"));
	let map = mapname || "etigeox-regions";
	let dim = dim || {
		height: 625,
		width: 500,
		mHeight: 625,
		mWidth: 500,
	};

	SectorDialog.addCloseListener();

	SectorDialog.cont["table(arc.func.Cons)"](t => {
		t.defaults().size(64 * 4, 64).pad(3);
		t.button(Core.bundle.format("etigeox.map.tab1"), Icon.terrain, () => {
			SectorDialog.hide();
			MapDialog("etigeox-regions", {
				height: 625,
				width: 500,
				mHeight: 625,
				mWidth: 500,
			});
		});
		t.button(Core.bundle.format("etigeox.map.tab2"), Icon.terrain, () => {
			SectorDialog.hide();
			MapDialog("etigeox-map-neoulandia", {
				height: 560,
				width: 1000,
				mHeight: 350,
				mWidth: 640,
			});
		});
	}).center().fillX().row();

	SectorDialog.cont.image(Core.atlas.find(map, Core.atlas.find("clear")))
		.height(Vars.mobile ? dim.mHeight : dim.height).width(Vars.mobile ? dim.mWidth : dim.width).pad(3).center()
		.row();

	SectorDialog.cont["table(arc.func.Cons)"](t => {
		t.defaults().size(128 * 4, 64).pad(3);
		t.button("@close", Icon.cancel, () => SectorDialog.hide());
	}).center().fillX();

	SectorDialog.show();
};

// Addons Menu
function AddonsButton() {
	var icons = {};
	var mods = ['etigeox', 'edt', 'blastanium', 'rubiginosus', 'accura', 'sefirah'];
	var buttons = [];

	for (var i = 0; i < mods.length; i++) {
		var mod = Vars.mods.getMod(mods[i]);
		if (mod != null && mod.enabled() === true) {
			icons[i] = Icon.play;
		} else {
			icons[i] = Icon.cancel;
		}
	}

	function addButton(btn, index) {
		buttons.push({ button: btn, index: index });
		return btn;
	}

	function paintButtons() {
		for (var i = 0; i < buttons.length; i++) {
			var entry = buttons[i];
			var modName = mods[entry.index];
			var mod = Vars.mods.getMod(modName);

			if (mod != null) {
				if (mod.enabled() === false) {
					entry.button.get().setColor(255, 0, 0, 1);
				} else {
					entry.button.get().setColor(0, 255, 0, 1);
				}
			} else {
				entry.button.get().setColor(255, 0, 0, 1);
			}

		}
	}

	Vars.ui.menuGroup["fill(arc.func.Cons)"](function (c) {
		c.top().right();
		c["table(arc.func.Cons)"](function (t) {
			t.defaults().size(48 * 4, 64).pad(3);
			var eb = t.button("Etigei Exile", icons[0], function () { checkMod(0); });
			var et = t.button("Timber", icons[1], function () { checkMod(1); });
			addButton(eb, 0);
			addButton(et, 1);
		}).size(150, 75).padTop(200).padRight(48 * 3);
	});

	Vars.ui.menuGroup["fill(arc.func.Cons)"](function (c) {
		c.top().right();
		c["table(arc.func.Cons)"](function (t) {
			t.defaults().size(48 * 4, 64).pad(3);
			var b = t.button("Blastanium", icons[2], function () { checkMod(2); });
			var r = t.button("Rubiginosus (Legacy)", icons[3], function () { checkMod(3); });
			addButton(b, 2);
			addButton(r, 3);
		}).size(150, 75).padTop(200 + 64 * 1.1).padRight(48 * 3);
	});

	Vars.ui.menuGroup["fill(arc.func.Cons)"](function (c) {
		c.top().right();
		c["table(arc.func.Cons)"](function (t) {
			t.defaults().size(48 * 4, 64).pad(3);
			var a = t.button("Terra Accura", icons[4], function () { checkMod(4); });
			var s = t.button("Sefirah", icons[5], function () { checkMod(5); });
			addButton(a, 4);
			addButton(s, 5);
		}).size(150, 75).padTop(200 + 64 * 2.2).padRight(48 * 3);
	});

	paintButtons();
}

const checkMod = (opt) => {
	const mod = Vars.mods.getMod("etigeox");

	Vars.ui.showCustomConfirm(
		Core.bundle.format("etigeox.addon", mod.meta.version), "@etigeox.addon.description",
		"@ok", "@cancel",
		() => {
			switch (opt) {
				case 0:
					Vars.ui.showCustomConfirm(
						Core.bundle.format("etigeox.update", mod.meta.version), "@etigeox.update.description",
						"@ok", "@cancel",
						() => {
							Vars.ui.mods.githubImportMod("Lysent/etigei-exile", false);
						},
						() => { }
					);
					break;

				case 1:
					Vars.ui.mods.githubImportMod("https://github.com/lysent/timber", false);
					break;

				case 3:
					Vars.ui.mods.githubImportMod("https://github.com/Mitemi/rubiginosus", false);
					break;

				case 2:
					Vars.ui.mods.githubImportMod("https://github.com/Mitemi/Blastanium", false);
					break;

				case 4:
					Vars.ui.showCustomConfirm(
						Core.bundle.format("etigeox.accura", mod.meta.version), "@etigeox.accura.description",
						"@ok", "@cancel",
						() => { },
						() => { }
					);
					break;

				case 5:
					Vars.ui.showCustomConfirm(
						Core.bundle.format("etigeox.sefirah", mod.meta.version), "@etigeox.sefirah.description",
						"@ok", "@cancel",
						() => { },
						() => { }
					);
					break;

				default:
					break;
			}
		},
		() => { }
	);
};

// Startup
Events.on(ClientLoadEvent, () => {
	const newsInstance = NewsDialog();
	newsInstance.load();
});