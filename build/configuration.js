"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
class Configuration {
    constructor() {
        // File name to look for
        this.name = "config.json";
        // Load configuration from file
        this.file = fs.readFileSync(this.name);
        this.config = JSON.parse(this.file.toString());
        // Assign configuration to each variable
        this.bot = this.config.bot;
        this.youtube = this.config.youtube;
        this.auto_roles = this.config.auto_roles;
        this.youtube_stats = this.config.youtube_stats;
        this.last_message_id = this.config.last_message_id;
    }
    modify(type, property, newValue) {
        return __awaiter(this, void 0, void 0, function* () {
            //Check if value exists in the current config
            if (!this.config.hasOwnProperty(type) && !this.config[type].hasOwnProperty(property)) {
                throw console.error(`No property defined with the name "${property}"`);
            }
            const newConfig = Object.assign(Object.assign({}, this.config), { [type]: Object.assign(Object.assign({}, this.config[type]), { [property]: newValue }) });
            fs.writeFileSync(this.name, JSON.stringify(newConfig, null, 4));
            this.reload();
        });
    }
    reload() {
        // Load configuration from file
        this.file = fs.readFileSync(this.name);
        this.config = JSON.parse(this.file.toString());
        // Assign configuration to each variable
        this.bot = this.config.bot;
        this.youtube = this.config.youtube;
        this.auto_roles = this.config.auto_roles;
        this.youtube_stats = this.config.youtube_stats;
        this.last_message_id = this.config.last_message_id;
    }
}
exports.default = Configuration;
