import './App.css'
import OasisC from './OasisC.mjs'
import {Button, Container, Form, InputGroup, Spinner, Stack} from "react-bootstrap";
import {FormEvent, useEffect, useRef, useState} from "react";

interface HistoryEntry {
    query: string,
    response: string
}

interface AppState {
    history: HistoryEntry[]
    currentEntry: number
}

function App() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [oasis, setOasis] = useState(null);
    const [appState, setAppState] = useState<AppState>({history: [], currentEntry: 0});

    function addToHistory(query: string, response: string) {
        setAppState({history: [...appState.history, {query, response}], currentEntry: 0});
    }

    function setCurrentEntry(input: string) {
        if (!oasis) return;

        const preprocessedInput = oasis.ccall('Oa_PreProcessInFix', 'string', ['string'], [input]);
        const expression = oasis.ccall('Oa_FromInFix', 'number', ['string'], [preprocessedInput]);
        setAppState({...appState, currentEntry: expression})
    }

    function onEntry(e: FormEvent) {
        e.preventDefault();

        if (inputRef.current) {
            inputRef.current.value = '';
        }

        if (!oasis || !appState.currentEntry) return;

        const queryStr = oasis.ccall('Oa_ExpressionToMathMLStr', 'string', ['number'], [appState.currentEntry])

        const result = oasis.ccall('Oa_SimplifyNF', 'number', ['number'], [appState.currentEntry]);
        const resultStr = oasis.ccall('Oa_ExpressionToMathMLStr', 'string', ['number'], [result])

        addToHistory(queryStr, resultStr);
    }

    useEffect(() => {
        async function loadOasis() {
            const module = await OasisC();
            setOasis(module);
        }

        loadOasis().then();
    }, [])

    if (!oasis) {
        return (
            <Spinner/>
        )
    }

    return (
        <Stack className={"min-vh-100"}>
            <div className="py-3 bg-body-tertiary border-bottom">
                <Container>
                    <h1 className={"fw-semibold"}>OASIS Web</h1>
                    <p className={"lead"}>Open Algebra Software for Inferring Solutions</p>
                </Container>
            </div>
            <div className={"flex-grow-1 py-3"}>
                <Container>
                    <Stack gap={3}>
                        {appState.history.map(({query, response}, index) => (
                            <Stack gap={3} key={index}>
                                <div className={"align-self-end bg-secondary-subtle rounded-5 p-3"}>
                                    <math display={"block"}
                                          dangerouslySetInnerHTML={{__html: query}}></math>
                                </div>
                                <div className={"align-self-start bg-primary-subtle rounded-5 p-3"}>
                                    <math display={"block"}
                                          dangerouslySetInnerHTML={{__html: response}}></math>
                                </div>
                            </Stack>
                        ))}
                        {
                            (appState.currentEntry && oasis) === 0
                                ? null
                                : <div className={"align-self-end bg-secondary-subtle rounded-5 p-3"}>
                                    <math display={"block"}
                                          dangerouslySetInnerHTML={{__html: oasis.ccall('Oa_ExpressionToMathMLStr', 'string', ['number'], [appState.currentEntry])}}></math>
                                </div>
                        }
                    </Stack>
                </Container>
            </div>
            <div className={"sticky-bottom bg-body-tertiary border-top"}>
                <Container>
                    <Form className={"my-3"} onSubmit={onEntry}>
                        <InputGroup>
                            <Form.Control
                                ref={inputRef}
                                placeholder="Enter an expression..."
                                onChange={() => {
                                    inputRef.current?.value && setCurrentEntry(inputRef.current?.value)
                                }}
                            />
                            <Button
                                variant="primary"
                                type={"submit"}
                            >Submit</Button>
                        </InputGroup>
                    </Form>
                </Container>
            </div>
        </Stack>
    )
}

export default App
