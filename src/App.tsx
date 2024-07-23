import './App.css'
import {Button, Container, Form, InputGroup, Stack} from "react-bootstrap";
import {useRef, useState} from "react";

function App() {
    const [entries, setEntries] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    function onEntry() {
        if (!inputRef.current?.value) return;

        setEntries([...entries, inputRef.current.value])
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    return (
        <>
            <Container>
                <Stack className={"min-vh-100 py-5"}>
                    <div>
                        <h1 className={"fw-semibold"}>OASIS Web</h1>
                        <p className={"lead"}>Open Algebra Software for Inferring Solutions</p>
                    </div>
                    <div className={"flex-grow-1"}>
                        <Stack gap={3}>
                            {entries.map((entry, index) => (
                                index % 2 === 0
                                    ? <div className={"align-self-end bg-secondary-subtle rounded p-3"} key={index}>{entry}</div>
                                    : <div className={"align-self-start bg-primary-subtle rounded p-3"} key={index}>{entry}</div>
                            ))}
                        </Stack>
                    </div>
                    <div className={"pt-5"}>
                        <InputGroup className="mb-3">
                            <Form.Control ref={inputRef} placeholder="Enter an expression..."/>
                            <Button
                                variant="primary"
                                id="button-addon2"
                                onClick={onEntry}
                            >Submit</Button>
                        </InputGroup>
                    </div>
                </Stack>
            </Container>
            <div ref={bottomRef} />
        </>
    )
}

export default App
