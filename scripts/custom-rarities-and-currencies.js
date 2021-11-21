const moduleName = "custom-rarities-and-currencies";
const currencyDict = {
    pp: "Platinum",
    gp: "Gold",
    ep: "Electrum",
    sp: "Silver",
    cp: "Copper"
};
let rarityColorsModuleActive;


Hooks.once("init", () => {
    // Open module API
    window.CustomRaritiesAndCurrencies = CustomRaritiesAndCurrencies;
    // Register module settings
    window.CustomRaritiesAndCurrencies.registerSettings();
});

Hooks.once("ready", () => {
    // Determine if Rarity Colors module is active
    rarityColorsModuleActive = game.modules.get("rarity-colors")?.active;
    // Register rarity customization hook
    window.CustomRaritiesAndCurrencies.rarityHook();
    // Register currency customization hook
    window.CustomRaritiesAndCurrencies.currencyHook();
});


class CustomRaritiesAndCurrencies {

    static registerSettings() {
        game.settings.register(moduleName, "spellFeats", {
            name: "Color Spell and Feature Names",
            hint: "",
            scope: "world",
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(moduleName, "hideConvert", {
            name: "Hide Currency Conversion Button",
            hint: "",
            scope: "world",
            config: true,
            type: Boolean,
            default: false
        });

        game.settings.register(moduleName, "rarityNames", {
            name: "",
            hint: "",
            scope: "world",
            config: false,
            type: Object,
            default: {
                "common": "",
                "uncommon": "",
                "rare": "",
                "very rare": "",
                "legendary": "",
                "artifact": ""
            }
        });

        game.settings.registerMenu(moduleName, "rarityNamesSubmenu", {
            name: "Customize Rarities",
            label: "Customize",
            icon: "fas fa-paint-brush",
            type: RarityNames,
            restricted: true
        });

        game.settings.register(moduleName, "currencyNames", {
            name: "",
            hint: "",
            scope: "world",
            config: false,
            type: Object,
            default: {
                "Copper": {
                    name: "",
                    active: true
                },
                "Silver": {
                    name: "",
                    active: true
                },
                "Electrum": {
                    name: "",
                    active: true
                },
                "Gold": {
                    name: "",
                    active: true
                },
                "Platinum": {
                    name: "",
                    active: true
                }
            }
        });

        game.settings.registerMenu(moduleName, "currencyNamesSubmenu", {
            name: "Customize Currencies",
            label: "Customize",
            icon: "fas fa-paint-brush",
            type: CurrencyNames,
            restricted: true
        });
    }

    static rarityHook() {
        Hooks.on("renderItemSheet", (app, html, appData) => {
            if (rarityColorsModuleActive) {
                // Color item name
                const itemNameElement = html.find(`input[name="name"]`);
                const itemType = appData.document.type;
                let rarity = appData.data.rarity || itemType;
                if (rarity === "veryRare") rarity = "veryrare";

                const isSpellFeat = itemType === "spell" || itemType === "feat";
                const spellFeatSetting = game.settings.get(moduleName, "spellFeats");

                let doColor = false;
                if (
                    (isSpellFeat && spellFeatSetting)
                    || (appData.data.rarity && appData.data.rarity !== "common")
                ) doColor = true;

                if (doColor) {
                    const color = game.settings.get("rarity-colors", rarity);
                    itemNameElement.css("color", color);
                }
            }
            
            // Change rarity select element
            const raritySelectElement = html.find(`select[name="data.rarity"]`);
            if (!raritySelectElement.length) return;

            const customRarities = game.settings.get(moduleName, "rarityNames");

            $(raritySelectElement).find(`option`).each(function() {
                let rarity = $(this).prop("value");
                if (!rarity) return;

                // Customize rarity names
                if (rarity === "veryRare") rarity = "very rare";
                if (customRarities[rarity]) $(this).text(customRarities[rarity]);

                if (rarityColorsModuleActive) {
                    if (rarity === "common") return;

                    // Color rarity select options
                    if (rarity === "very rare") rarity = "veryrare";
                    const color = game.settings.get("rarity-colors", rarity);
                    $(this).css("color", color);

                    // Color selected option
                    if ($(this).prop("selected")) {
                        $(this).css("background-color", color);
                        $(this).css("color", "white");
                    }
                }
            });

        });
    }

    static currencyHook() {
        Hooks.on("renderActorSheet", (app, html, appData) => {
            const currencyRowElement = html.find(`ol.currency.flexrow`);
            if (!currencyRowElement.length) return;

            // Customize currency active state and name
            const customCurrencies = game.settings.get(moduleName, "currencyNames");

            for (const xp of Object.keys(currencyDict)) {
                const currencyLabelElement = $(currencyRowElement).find(`label.${xp}`);
                const currencyInputElement = $(currencyLabelElement).next(`input`);
                
                // Remove inactive currencies from sheet
                const currentCurrency = customCurrencies[currencyDict[xp]];
                if (!currentCurrency.active) {
                    $(currencyLabelElement).remove();
                    $(currencyInputElement).remove();

                    continue;
                }

                // Change currency name
                if (currentCurrency.name) $(currencyLabelElement).text(currentCurrency.name);
            }

            // Hide currency conversion button
            if (game.settings.get(moduleName, "hideConvert")) html.find(`a.currency-convert`).remove();
        });
    }

}

class RarityNames extends FormApplication {

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            title: "Customize Rarity Names",
            template: `modules/${moduleName}/templates/rarityNames.hbs`
        };
    }

    getData() {
        const settingsData = game.settings.get(moduleName, "rarityNames");
        const data = {};
        for (const [k, v] of Object.entries(settingsData)) {
            data[capitalizeFirstLetter(k)] = v;
        }

        return data;
    }

    async _updateObject(event, formData) {
        const data = {};
        for (const [k, v] of Object.entries(formData)) {
            data[k.toLowerCase()] = v;
        }
        await game.settings.set(moduleName, "rarityNames", data);
    }

}

class CurrencyNames extends FormApplication {

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            title: "Customize Currencies",
            template: `modules/${moduleName}/templates/currencyNames.hbs`
        };
    }

    getData() {
        return game.settings.get(moduleName, "currencyNames");
    }

    async _updateObject(event, formData) {
        const data = {};
        for (const currency of Object.keys(game.settings.get(moduleName, "currencyNames"))) {
            data[currency] = {};
            data[currency].name = formData[`${currency}.name`];
            data[currency].active = formData[`${currency}.active`];
        }

        await game.settings.set(moduleName, "currencyNames", data);
    }
}


function capitalizeFirstLetter(str) {
    return str[0].toUpperCase() + str.slice(1);
}
