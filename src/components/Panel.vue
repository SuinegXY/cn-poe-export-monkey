<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import CnPoeTranslator from "cn-poe-translator/dist/index.global"
import CnPoeExportDb from "cn-poe-export-db/dist/db.global"
import BuildingCreater from "pob-building-creater/dist/creater.global"
import axios from "axios"

const accountName = ref("")
const realm = "pc"
const characters = ref([])
const leagues = ref([])
const leagueMap = ref(new Map())
const currLeague = ref("")
const currCharacters = ref([])
const currCharacter = ref("")
const buildingCode = ref("")
const state = reactive({
    accountName,
    realm,
    characters,
    leagues,
    leagueMap,
    currLeague,
    currCharacters,
    currCharacter,
    buildingCode,
})

const getCharactersReady = computed(() => {
    return Boolean(state.accountName)
})
const selectReady = computed(() => {
    return state.characters.length > 0
})
const exportReady = computed(() => {
    return state.characters.length > 0 && Boolean(state.currCharacter)
})

function selectNewLeague() {
    state.currCharacters = state.leagueMap.get(state.currLeague);
    state.currCharacter = state.currCharacters[0].name;
}

function getCharacters() {
    const url = "/character-window/get-characters";
    const realm = state.realm;
    const accountName = state.accountName;

    let form = new URLSearchParams();
    form.append("accountName", accountName);
    form.append("realm", realm);

    state.currLeague = "";
    state.currCharacter = "";

    axios
        .post(url, form)
        .then((res) => {
            const characters = res.data;
            state.characters = characters;

            let leagueMap = new Map();
            for (const character of characters) {
                const leagueName = character.league;
                let list = leagueMap.get(leagueName);
                if (list === undefined) {
                    list = [];
                    leagueMap.set(leagueName, list);
                }
                list.push(character);
            }
            state.leagueMap = leagueMap;
            const leagues = Array.from(leagueMap.keys());
            state.leagues = leagues;
            if (leagues.length > 0) {
                state.currLeague = leagues[0];
                selectNewLeague();
            }
        })
        .catch((err) => {
            state.leagues = [];
            state.characters = [];
            console.log(err);
            alert(err);
        });
}

async function getItems() {
    const url = "/character-window/get-items";
    const realm = state.realm;
    const accountName = state.accountName;
    const character = state.currCharacter;

    let form = new URLSearchParams();
    form.append("accountName", accountName);
    form.append("realm", realm);
    form.append("character", character);

    const res = await axios.post(url, form);
    return res.data;
}

async function getPassiveSkills() {
    const url = "/character-window/get-passive-skills";
    const realm = state.realm;
    const accountName = state.accountName;
    const character = state.currCharacter;

    let params = new URLSearchParams();
    params.append("accountName", accountName);
    params.append("realm", realm);
    params.append("character", character);

    const res = await axios.get(url, { params });
    return res.data;
}

const factory = CnPoeTranslator.newBasicTranslatorFactory(CnPoeExportDb);
const jsonTranslator = factory.getJsonTranslator()

async function exportBuilding() {
    let items;
    let passiveSkills;
    try {
        items = await getItems();
        passiveSkills = await getPassiveSkills();
    } catch (err) {
        alert(`加载角色数据失败: ${err}`);
    }

    jsonTranslator.translateItems(items);
    jsonTranslator.translatePassiveSkills(passiveSkills);
    const building = BuildingCreater.transform(items, passiveSkills)

    const compressed = window.pako.deflate(building.toString())

    const code = btoa(String.fromCharCode.apply (null, compressed)).replaceAll("+", "-").replaceAll("/", "_")

    state.buildingCode = code
}

function copyBuildingCode() {
    navigator.clipboard.writeText(state.buildingCode);
}

function getInitialAccountName() {
    let pattern = new RegExp("/account/view-profile/([^/?]+)");
    let match = pattern.exec(window.location.href);
    if (match) {
        return decodeURI(match[1]);
    }
    return "";
}

onMounted(() => {
    state.accountName = getInitialAccountName()
})
</script>

<template>
    <span class="line-container">
        <input type="text" placeholder="输入论坛账户名" maxlength="50" v-model.trim="state.accountName" />
        <button @click="getCharacters" :disabled="!getCharactersReady">开始</button>
    </span>
    <span class="line-container">
        <div v-if="selectReady">
            <select v-model="state.currLeague" v-if="selectReady" @change="selectNewLeague">
                <option v-for="item in leagues" :key="item" :value="item">
                    {{ item }}
                </option>
            </select>
            <select v-model="state.currCharacter" v-if="selectReady">
                <option v-for="item in state.currCharacters" :key="item.name" :value="item.name">
                    {{ item.name }},{{ item.level }},{{ item.class }}
                </option>
            </select>
            <button :disabled="!exportReady" v-if="selectReady" @click="exportBuilding">导出</button>
        </div>
        <div v-else>
            <select disabled></select>
            <select disabled></select>
            <button disabled>导出</button>
        </div>
    </span>
    <span class="line-container">
        <input disabled maxlength="50" :value="state.buildingCode" />
        <button @click="copyBuildingCode" :disabled="!state.buildingCode">复制</button>
    </span>
</template>
  
<style scoped>
.line-container {
    display: flex;
    margin: 3px 0;
    min-height: 25px;
}

.line-container select {
    min-height: 25px;
    margin-right: 4px;
    min-width: 100px;
}

.line-container input {
    margin-right: 4px;
}
</style>
  