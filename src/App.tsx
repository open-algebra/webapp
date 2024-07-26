import './App.css'
import {Alert, Button, Container, Form, InputGroup, Modal, Spinner, Stack} from "react-bootstrap";
import {FormEvent, useEffect, useRef, useState} from "react";
import FunctionBuilder from "./components/FunctionBuilder.tsx";

interface HistoryEntry {
    query: string,
    response: string
    error: boolean
}

interface AppState {
    history: HistoryEntry[]
    currentEntry: number,
}

function App() {
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [oasis, setOasis] = useState(null);
    const [appState, setAppState] = useState<AppState>({history: [], currentEntry: 0});
    const [showHelp, setShowHelp] = useState(false);
    const [showDerivativeBuilder, setShowDerivativeBuilder] = useState(false);
    const [showIntegralBuilder, setShowIntegralBuilder] = useState(false);
    const [showLogBuilder, setShowLogBuilder] = useState(false);

    function addToHistory(query: string, response: string) {
        setAppState({...appState, history: [...appState.history, {query, response, error: false}], currentEntry: 0});
    }

    function addErrorToHistory(query: string, response: string) {
        setAppState({...appState, history: [...appState.history, {query, response, error: true}], currentEntry: 0});
    }

    function appendToInput(addition: string) {
        if (!inputRef.current) return;
        inputRef.current.value += (inputRef.current.value === '' ? '' : ' ') + addition;
        parseInput()
    }

    function parseInput() {
        if (!oasis || !inputRef.current?.value) return;

        const preprocessedInput = oasis.ccall('Oa_PreProcessInFix', 'string', ['string'], [inputRef.current?.value]);
        const expression = oasis.ccall('Oa_FromInFix', 'number', ['string'], [preprocessedInput]);
        setAppState({...appState, currentEntry: expression})
    }

    function closeHelp() {
        setShowHelp(false)
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault();

        if (!oasis || !appState.currentEntry) return;

        const queryStr = oasis.ccall('Oa_ExpressionToMathMLStr', 'string', ['number'], [appState.currentEntry])

        if (inputRef.current) {
            inputRef.current.value = '';
        }

        let result;
        try {
            result = oasis.ccall('Oa_SimplifyNF', 'number', ['number'], [appState.currentEntry]);
        } catch (error) {
            addErrorToHistory(queryStr, (error as Error).message)
            return;
        }

        const resultStr = oasis.ccall('Oa_ExpressionToMathMLStr', 'string', ['number'], [result])
        addToHistory(queryStr, resultStr);
    }

    useEffect(() => {
        async function loadOasis() {
            const module = await import('./OasisC.mjs')
            const wasm = await module.default();
            setOasis(wasm);
        }

        loadOasis().then();
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [appState]);

    if (!oasis) {
        return (
            <Spinner/>
        )
    }

    return (
        <>
            <FunctionBuilder title={"Derivative Builder"} func={"dd"} firstArgLabel={"Argument"}
                             secondArgLabel={"Variable"} show={showDerivativeBuilder}
                             setShow={setShowDerivativeBuilder}
                             setResult={appendToInput} oasis={oasis}/>
            <FunctionBuilder title={"Integral Builder"} func={"in"} firstArgLabel={"Argument"}
                             secondArgLabel={"Variable"} show={showIntegralBuilder}
                             setShow={setShowIntegralBuilder}
                             setResult={appendToInput} oasis={oasis}/>
            <FunctionBuilder title={"Logarithm Builder"} func={"log"} firstArgLabel={"Base"}
                             secondArgLabel={"Argument"} show={showLogBuilder}
                             setShow={setShowLogBuilder}
                             setResult={appendToInput} oasis={oasis}/>
            <Modal show={showHelp} onHide={closeHelp}>
                <Modal.Header closeButton>
                    <Modal.Title>Help</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className={"pb-3"}>
                        Welcome to OASIS! To get started, type in any expression such as "2x+3x". Oasis automatically
                        recognizes the variables and is able to add them for you. Some variable names are reserved. For
                        instance "i" is reserved for imaginary numbers.
                    </div>
                    <h5>Functions</h5>
                    Oasis also understands some functions. For instance, <code>dd(x^2,x)</code> takes derivative of x^2
                    with respect to x. Likewise, <code>in(2x,x)</code> takes the integral of 2x with respect to x
                    and &nbsp; <code>log(10,100)</code>
                    takes the logarithm of 100 with a base of 10.
                </Modal.Body>
            </Modal>
            <Stack className="min-vh-100">
                <Container fluid className="text-center py-3">
                    <h1 className={"fw-semibold"}>OASIS Web</h1>
                    <p className={"lead"}>Open Algebra Software for Inferring Solutions</p>
                    <Stack direction="horizontal" gap={2} className="justify-content-center">
                        <a href={"https://github.com/open-algebra/Oasis"} className={"btn btn-dark"}>GitHub</a>
                        <Button variant={"light"} onClick={() => setShowHelp(true)}
                                className={"border"}>Help</Button>
                    </Stack>
                </Container>
                <div className={"flex-grow-1 py-3"}>
                    <Container>
                        <Stack gap={3}>
                            <Alert variant={"warning"}>Oasis, OasisC, and Oasis Web are still under active development.
                                Here be dragons. If something does not work, please feel free to <Alert.Link
                                    href={"https://github.com/open-algebra/Oasis/issues/new/choose"}>file an
                                    issue</Alert.Link>!</Alert>
                            {appState.history.map(({query, response, error}, index) => (
                                <Stack gap={3} key={index}>
                                    <div className={"align-self-end bg-primary-subtle rounded-5 p-3"}>
                                        <math display={"block"}
                                              dangerouslySetInnerHTML={{__html: query}}></math>
                                    </div>
                                    {error
                                        ? <div className={"align-self-start bg-danger-subtle rounded-5 p-3"}>
                                            <strong>Error:</strong> {response}
                                        </div>
                                        : <div className={"align-self-start bg-secondary-subtle rounded-5 p-3"}>
                                            <math display={"block"}
                                                  dangerouslySetInnerHTML={{__html: response}}></math>
                                        </div>}
                                </Stack>
                            ))}
                            {
                                !(appState.currentEntry && oasis)
                                    ? null
                                    : <div className={"align-self-end bg-primary-subtle rounded-5 p-3"}>
                                        <math display={"block"}
                                              dangerouslySetInnerHTML={{__html: oasis.ccall('Oa_ExpressionToMathMLStr', 'string', ['number'], [appState.currentEntry])}}></math>
                                    </div>
                            }
                        </Stack>
                    </Container>
                </div>
                <div className={"bg-body shadow sticky-bottom"}>
                    <Container className={"my-3"}>
                        <Stack gap={2}>
                            <Stack direction={"horizontal"} gap={2}>
                                <Button variant={"light"} className={"border"} onClick={() => setShowDerivativeBuilder(true)}>Derivative</Button>
                                <Button variant={"light"} className={"border"} onClick={() => setShowIntegralBuilder(true)}>Integral</Button>
                                <Button variant={"light"} className={"border"} onClick={() => setShowLogBuilder(true)}>Logarithm</Button>
                            </Stack>
                            <Form onSubmit={onSubmit}>
                                <InputGroup hasValidation>
                                    <Form.Control
                                        ref={inputRef}
                                        placeholder="Enter an expression..."
                                        isInvalid={appState.currentEntry === 0 && !!inputRef.current?.value}
                                        onChange={parseInput}
                                    />
                                    <Button
                                        variant="primary"
                                        type={"submit"}
                                        disabled={!appState.currentEntry}
                                    >Submit</Button>
                                    <Form.Control.Feedback type={"invalid"}>Failed to parse
                                        expression</Form.Control.Feedback>
                                </InputGroup>
                            </Form>
                        </Stack>
                    </Container>
                </div>
            </Stack>
            <div ref={bottomRef}/>
        </>
    )
}

export default App
