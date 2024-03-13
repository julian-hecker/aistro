#!/usr/bin/env node

import "reflect-metadata";
import { program } from "commander";

import { version } from "../package.json";
import { browseCommand, newBrowse } from "./commands/browse";

program
    .version(version)
    .addCommand(browseCommand)
    .addCommand(newBrowse)
    .parse();
