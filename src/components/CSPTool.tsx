import React, { useEffect, useState } from "react";
import { Directives } from "./AddPolicy";
import { ImportPolicy } from "./ImportPolicy";
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import { Container, Typography } from "@mui/material";
import { getPolicyString, policyParser } from "../utils/csp-utils";
import directivesArray from "../utils/directives";
import { AddEditDialog } from "./AddEditDialog";

type CSPToolProps = {
    directives: Object
}

export const CSPTool: React.FC<CSPToolProps> = ({ directives: directivesFromURL }) => {

    const [directives, setDirectives] = useState<Object>({})
    const [directiveList, setDirectiveList] = useState<string[]>([]);
    const [isOpen, setOpen] = useState<boolean>(false);
    const [dir, setDir] = useState<string>("");
    const [src, setSrc] = useState<string[]>([]);
    const [suggestionList, setSuggestionList] = useState<string[]>([]);

    useEffect(() => {
        setDirectiveList(directivesArray);
        const dirs = {};
        if (Object.keys(directivesFromURL).length > 0) {
            setDirectives(directivesFromURL);
        } else {
            directivesArray.forEach((directive) => {
                dirs[directive] = [];
            });
            setDirectives(dirs);
        }
    }, [])

    useEffect(() => {
        const dirList = [...directivesArray];
        const keys = [];
        Object.keys({ ...directives })
            .forEach((directive) => {
                if (directives[directive].length > 0) {
                    keys.push(directive);
                }
            })
        const dirs = dirList.filter((dir) => {
            return !keys.includes(dir);
        })

        setDirectiveList(dirs);

        let suggestionList = [];
        Object.values(directives)
            .forEach((sources) => {
                if (sources.length > 0) {
                    suggestionList.push(...sources)
                }
            })
        suggestionList = Array.from(new Set(suggestionList));
        setSuggestionList(suggestionList);

        window.history.replaceState({}, "", `${window.location.origin}?config=${window.btoa(getPolicyString(directives))}`);

    }, [directives]);

    const onClose = () => {
        setOpen(false);
        setDir("")
        setSrc([]);
    }

    const addSuggestion = (text: string) => {
        let suggestions = [...suggestionList];
        suggestions.push(text);
        suggestions = Array.from(new Set(suggestions));

        setSuggestionList(suggestions);
    };

    const handleAddDirective = (policy: string) => {
        if (policy === "new") {
            setDir("")
            setSrc([]);
            setOpen(true);

            return;
        }
        if (policy?.length > 0) {
            const csp = policyParser(policy);
            const dir = { ...directives }

            Object.keys(csp)
                .forEach((item) => {
                    if (directivesArray.includes(item)) {
                        const sources = Array.from(new Set(dir[item].concat(csp[item])));
                        dir[item] = sources;
                    }
                });
            setDirectives(dir);
        }
    };

    const addSourcesToDirective = (dir: string, src: string[]) => {
        const policies = { ...directives };

        if (src.length === 0) {
            policies[dir] = [];
        } else if (!policies[dir] || policies[dir].length === 0) {
            policies[dir] = src;
        } else {
            const sources = Array.from(new Set(src));
            policies[dir] = sources;
        }
        setDirectives(policies);
        setOpen(false);
    };

    const handleEditDirective = (dir: string, src: string[]) => {
        setDir(dir);
        setSrc(src);
        setOpen(true);
    };

    const handleReset = () => {
        const dirs = {};
        directivesArray.forEach((directive) => {
            dirs[directive] = [];
        });
        setDirectives(dirs);
    };

    const handleReplace = (oldString: string, newString: string) => {
        const dirs = {...directives};

        let policyString = getPolicyString(dirs);
        policyString = policyString.replaceAll(oldString, newString);

        const parsedPolicy = policyParser(policyString);
        setDirectives(parsedPolicy);    
    }

    const deleteSourcesWithRegex = (regex: string) => {
        const rex = new RegExp(regex);
        const dirs = { ...directives };

        Object.keys(dirs)
            .forEach((directive) => {
                if (dirs[directive].length > 0) {
                    const filteredSourceList = dirs[directive]
                        .filter((source) => {
                            return rex.exec(source) === null;
                        })
                    dirs[directive] = filteredSourceList;
                }
            });
        
            setDirectives(dirs);
    };

    return (<React.Fragment>
        <Typography component={'span'} variant={'body2'}>
            <Container fixed>
                <Grid container spacing={4} sx={{ padding: "100px" }}>
                    <Grid item xs={12}>
                        <ImportPolicy 
                            deleteSourcesWithRegex={deleteSourcesWithRegex}
                        handleReplace={handleReplace}
                        handleReset={handleReset} 
                        handleAddDirective={handleAddDirective} 
                        directives={directives} />
                    </Grid>
                    <Grid item xs={12}>
                        <Divider>
                            <Chip label="Policies" />
                        </Divider>
                    </Grid>
                    <Grid item xs={12}>
                        <Directives
                            addSourcesToDirective={addSourcesToDirective}
                            directives={directives}
                            handleEditDirective={handleEditDirective} />
                    </Grid>
                </Grid>
                <AddEditDialog
                    isOpen={isOpen}
                    onClose={onClose}
                    directiveList={directiveList}
                    addSourcesToDirective={addSourcesToDirective}
                    dir={dir}
                    src={src}
                    suggestionList={suggestionList}
                    addSuggestion={addSuggestion} />
            </Container>
        </Typography>
    </React.Fragment>)
}