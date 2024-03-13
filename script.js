document.addEventListener('DOMContentLoaded', function() {
    const gates = ['H', 'X', 'Y', 'Z', 'C', 'N', 'P', 'T', 'I', 'm'];
    const gatePalette = document.getElementById('gatePalette');
    const circuit = document.getElementById('circuit');
    let qubitCount = 0;
    let draggedGate = null;
    let quic;

    // Function to allow dropping
    function allowDrop(ev) {
        ev.preventDefault();
    }

    // Function to handle drag start
    function dragStart(ev) {
        // Set the data to the type of gate instead of the element ID
        ev.dataTransfer.setData("text/plain", ev.target.textContent);
        ev.target.classList.add('dragging');
        draggedGate = ev.target;
    
        // Check if the dragged gate is from the palette or from the circuit
        if (!ev.target.classList.contains('palette-gate')) {
            // The gate is from the circuit, set a flag in the dataTransfer object
            ev.dataTransfer.setData("fromCircuit", "true");
        }
    }

    // Function to check if a point is inside the circuit
    function isInsideCircuit(element) {
        const circuitRect = document.getElementById('circuitContainer').getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
    
        // Calculate the center of the element
        const centerX = elementRect.left + elementRect.width / 2;
        const centerY = elementRect.top + elementRect.height / 2;
    
        // Check if the center of the element is inside the circuit
        return centerX >= circuitRect.left && centerX <= circuitRect.right && centerY >= circuitRect.top && centerY <= circuitRect.bottom;
    }

    // Function to handle drag end
    function dragEnd(ev) {
        // Check if the dragged gate is from the palette or from the circuit
        const fromCircuit = ev.dataTransfer.getData("fromCircuit") === "true";
    
        // If the gate is from the circuit and it's outside the circuit, remove it
        if (fromCircuit) {
            ev.target.remove();
        }
    
        // Remove the dragging class from the original element in the palette
        ev.target.classList.remove('dragging');
    }

    // Function to handle drop
    // Function to handle drop
    function drop(ev) {
        ev.preventDefault();
        const gateType = ev.dataTransfer.getData("text/plain");
        const itemType = ev.dataTransfer.getData("text/plain");

        if (itemType === 'Separator') {
            placeSeparator(ev.clientX);
            return;
        }

        // Check if the dragged gate is from the palette or from the circuit
        const fromCircuit = ev.dataTransfer.getData("fromCircuit") === "true";

        if (fromCircuit && !ev.target.classList.contains('qubit-line') && !ev.target.classList.contains('qubit-wire')) {
            draggedGate.remove();
        }

        let gate;
        if (fromCircuit) {
            // The gate is from the circuit, use the existing gate
            gate = draggedGate;
            gate.addEventListener('dragend', dragEnd);
        } else {
            // The gate is from the palette, create a new gate
            gate = document.createElement('div');
            gate.textContent = gateType;
            gate.classList.add('gate');
            gate.classList.remove('palette-gate'); // Remove the 'palette-gate' class
            gate.classList.add('circuit-gate'); // Add the 'circuit-gate' class
            gate.setAttribute('draggable', 'true');
            gate.addEventListener('dragstart', dragStart);
            gate.addEventListener('dragend', dragEnd);
        }

        // Create a new gate element

        let dropTarget = ev.target;

        // If the drop target is the qubit line or the wire, find the correct insert position
        if (dropTarget.classList.contains('qubit-line') || dropTarget.classList.contains('qubit-wire')) {
            // If the wire is the target, get its parent qubit line
            if (dropTarget.classList.contains('qubit-wire')) {
                dropTarget = dropTarget.parentNode;
            }
            
            // Get the bounding rectangle of the qubit line
            const qubitRect = dropTarget.getBoundingClientRect();
            // Calculate the horizontal position where the gate was dropped
            const dropPositionX = ev.clientX - qubitRect.left;

            // Find the insert position based on existing gates in the qubit line
            let insertAfterElement = null;
            const children = Array.from(dropTarget.children);
            for (let child of children) {
                if (child.classList.contains('gate') || child.classList.contains('qubit-label')) {
                    const childRect = child.getBoundingClientRect();
                    const childCenterX = childRect.left + childRect.width / 2 - qubitRect.left;
                    if (dropPositionX > childCenterX) {
                        insertAfterElement = child;
                    } else {
                        break;
                    }
                }
            }

            // Insert the new gate after the determined element or at the start if null
            if (insertAfterElement) {
                insertAfterElement.parentNode.insertBefore(gate, insertAfterElement.nextSibling);
            } else {
                // This would be the case if no gates are present or it should be the first gate
                dropTarget.insertBefore(gate, dropTarget.firstChild);
            }
            drawControlLines();
        } else {
            if (fromCircuit) {
                draggedGate.remove();
            }
        }

        // Remove the dragging class from the original element in the palette
        draggedGate.classList.remove('dragging');
        
    }
    function placeSeparator(dropX) {
        // Obtain the circuit container
        const circuitContainer = document.getElementById('circuit');
        // Calculate the circuit's offset from the left and top of the document
        const circuitRect = circuitContainer.getBoundingClientRect();
    
        // Adjust the dropX to be relative to the circuit container
        const relativeDropX = dropX - circuitRect.left;
    
        // Create the separator element
        const separator = document.createElement('div');
        separator.classList.add('circuit-separator');
        
        // Set the position of the separator based on the adjusted dropX value
        separator.style.position = 'absolute';
        separator.style.left = `${relativeDropX}px`;
        // Adjust the top position if needed; for example, if you want it to be 10px from the top of the circuit
        separator.style.top = '0px'; // Change this value if you want it positioned lower
        separator.style.height = `${circuitContainer.offsetHeight}px`;
        separator.style.width = '2px';
        separator.style.backgroundColor = '#000';
    
        // Append the separator to the circuit container
        circuitContainer.appendChild(separator);
    }
    
    function updateSeparatorsHeight() {
        // Get the new height of the circuit container
        const newHeight = document.getElementById('circuit').offsetHeight;
        
        // Select all separators and update their height
        const separators = document.querySelectorAll('.circuit-separator');
        separators.forEach(separator => {
            separator.style.height = `${newHeight}px`;
        });
    }
    
    

    // Function to add a qubit line to the circuit
    function addQubit() {
        if (qubitCount < 8) {
            const qubitLine = document.createElement('div');
            qubitLine.classList.add('qubit-line');
            qubitLine.setAttribute('data-qubit', qubitCount);
            qubitLine.addEventListener('dragover', allowDrop);
            qubitLine.addEventListener('drop', drop);
            
            // Create and append the label
            const label = document.createElement('span');
            label.classList.add('qubit-label');
            label.textContent = `q[${qubitCount}]: `;
            qubitLine.appendChild(label);
            
            // Create and append the wire element
            const wire = document.createElement('div');
            wire.classList.add('qubit-wire');
            qubitLine.appendChild(wire);
            
            circuit.appendChild(qubitLine);
            qubitCount++;

            const removeButton = document.createElement('button');
            removeButton.textContent = 'x';
            removeButton.classList.add('remove-qubit');
            removeButton.onclick = removeQubit; // Attach the remove function
            qubitLine.appendChild(removeButton);
            updateSeparatorsHeight();
        } else {
            alert('Maximum of 8 qubits reached.');
        }
    }

    function removeQubit(ev) {
        const qubitLine = ev.target.parentNode;
        qubitLine.parentNode.removeChild(qubitLine);
        // Update the qubit count
        qubitCount--;
        // Update qubit labels
        updateQubitLabels();
        drawControlLines();
        updateSeparatorsHeight();

    }

    function updateQubitLabels() {
        const qubitLines = document.querySelectorAll('.qubit-line');
        qubitLines.forEach((line, index) => {
            const label = line.querySelector('.qubit-label');
            label.textContent = `q[${index}]: `;
        });
    }

    // Add gates to the palette
    gates.forEach(function(gate, index) {
        const gateElement = document.createElement('div');
        gateElement.textContent = gate;
        gateElement.classList.add('gate', 'palette-gate');
        gateElement.setAttribute('draggable', 'true');
        gateElement.setAttribute('id', `gate-${index}`);
        gateElement.addEventListener('dragstart', dragStart);
        gateElement.addEventListener('dragend', dragEnd);
        gatePalette.appendChild(gateElement);
    });


// Function to generate QUIC
function generateQuic() {
    const qubitLines = document.querySelectorAll('.qubit-line');
    const depthGates = [];
    let maxDepth = 0;

    // Find the maximum depth
    qubitLines.forEach(line => {
        maxDepth = Math.max(maxDepth, line.children.length - 3); // -1 to exclude the qubit label
    });

    // Initialize depthGates with 'I'
    for (let i = 0; i < maxDepth; i++) {
        depthGates[i] = Array(qubitLines.length).fill('I');
    }

    // Populate depthGates with actual gates
    qubitLines.forEach((line, qubitIndex) => {
        line.querySelectorAll('.gate').forEach((gate, gateIndex) => {
            depthGates[gateIndex][qubitIndex] = gate.textContent;
        });
    });

    // Join the gates with commas and create the QUIC string
    quic = depthGates.map(depth => depth.join('')).join(',');
    
    // Output the QUIC (here we simply log it to the console, you can change this to display it on the page)
    console.log(quic);

    // Optionally, output to the page
    const quicDisplay = document.getElementById('quicDisplay');
    if (!quicDisplay) {
        const display = document.createElement('div');
        display.id = 'quicDisplay';
        display.textContent = quic;
        document.body.appendChild(display);
    } else {
        quicDisplay.textContent = quic;
        bubble_fn_quic(quic);
    }
}
function runCircuitFromString(circuitString) {
    // Clear existing circuit first
    document.getElementById('refresh').click();

    const steps = circuitString.split(',');
    const qubitCount = steps[0].length; // Determine the number of qubits based on the first step

    // Ensure there are enough qubits
    while (qubitCount > document.querySelectorAll('.qubit-line').length) {
        addQubit();
    }

    // Iterate over each step to place gates
    steps.reverse().forEach((step, stepIndex) => {
        step.split('').forEach((gate, qubitIndex) => {
            
            const qubitLine = document.querySelector(`.qubit-line[data-qubit="${qubitIndex}"]`);
            placeGate(qubitLine, gate, stepIndex + 2); // +2 to account for qubit label and wire
        
        });
    });

    function placeGate(qubitLine, gateType) {
        const gate = document.createElement('div');
        gate.textContent = gateType;
        gate.classList.add('gate', 'circuit-gate');
        // Insert the new gate right after the qubit label, which is the first child
        qubitLine.insertBefore(gate, qubitLine.children[1]); // Insert after the label
    }
    
}

function drawControlLines() {
    // Clear any existing control lines
    // Modify this part in the drawControlLines function:
    document.querySelectorAll('.gate.red-border').forEach(gate => gate.classList.remove('red-border'));

    // Iterate over each depth (column) to find connections and draw lines
    const maxDepth = findMaxDepth();
    for (let depth = 0; depth <= maxDepth; depth++) {
        let controlGateElement = null;
        const targetGatesElements = [];

        // Find control gate 'C' and target gates 'X', 'Y', 'Z' at this depth in the circuit
        circuit.querySelectorAll(`.qubit-line .gate:nth-child(${depth + 2})`).forEach(gate => {
            if (gate.textContent === 'C') {
                controlGateElement = gate;
            } else if (['X', 'Y', 'Z', 'N'].includes(gate.textContent)) {
                targetGatesElements.push(gate);
            }
        });

        // Only draw lines and add red borders if there is a control and at least one target gate
        if (controlGateElement && targetGatesElements.length > 0) {
            controlGateElement.classList.add('red-border');
            targetGatesElements.forEach(targetGate => {
                // Draw line between control and target gate
                drawLine(controlGateElement, targetGate);
                // Add red border to target gate
                targetGate.classList.add('red-border');
            });
        }
    }

// Your existing drawLine function appears correct; it should draw the line correctly now

}


function findMaxDepth() {
    return Array.from(document.querySelectorAll('.qubit-line'))
        .reduce((max, line) => Math.max(max, line.querySelectorAll('.gate').length), 0);
}

function drawLine(fromElement, toElement) {
    // Calculate the top and bottom positions of the gates
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    // Determine the starting and ending Y positions of the line
    const startY = Math.min(fromRect.bottom, toRect.bottom);
    const endY = Math.max(fromRect.top, toRect.top);

    // Create the line element
    const line = document.createElement('div');
    line.classList.add('control-line');
    
    // Set the position and style of the line
    line.style.position = 'absolute';
    line.style.left = `${fromRect.left + (fromRect.width / 2) - 1}px`; // Center the line on the gate
    line.style.top = `${startY}px`; // Start from the bottom of the 'C' gate
    line.style.width = '2px';
    line.style.height = `${endY - startY}px`; // The height should be the difference between the endY and startY
    line.style.backgroundColor = 'grey';
    
    // Add the line to the body of the document or to a specific container if required
    document.body.appendChild(line);
}


    
document.getElementById('dragSeparator').addEventListener('dragstart', function(ev) {
    ev.dataTransfer.setData("text/plain", 'Separator');
    draggedGate = null; // Ensure gate dragging is not confused
});


document.getElementById('generateQuic').addEventListener('click', generateQuic);


    // Initialize with one qubit line
    addQubit();
    drawControlLines();


    // Add event listener for the 'Add Qubit' button
    document.getElementById('addQubit').addEventListener('click', function () {
        addQubit();
        drawControlLines();
    });
    document.getElementById('circuit').addEventListener('dragover', function(ev) {
        ev.preventDefault();
    });
    document.addEventListener('drop', function(ev) {
        ev.preventDefault();
        // Check if the drop event occurred outside the "circuitContainer" element
        if (draggedGate && ev.target.id !== 'circuit' && !ev.target.closest('#circuit')) {
            draggedGate.parentNode.removeChild(draggedGate);
            draggedGate = null;
        }
    });

    document.getElementById('runCircuit').addEventListener('click', function () {
        const circuitString = document.getElementById('circuitInput').value;
        runCircuitFromString(circuitString);
    });
    
    document.getElementById('refresh').addEventListener('click', function () {
        // Remove all qubit lines
        const qubitLines = document.querySelectorAll('.qubit-line');
        qubitLines.forEach((line) => {
            line.parentNode.removeChild(line);
        });
    
        const controlLines = document.querySelectorAll('.control-line');
        controlLines.forEach((line) => {
            line.remove(); // This removes the control lines from the DOM
        });

        const separatorLines = document.querySelectorAll('.circuit-separator');
        separatorLines.forEach((line) => {
            line.remove(); // This removes the separator lines from the DOM
        });


        // Reset qubit count
        qubitCount = 0;

        
    
        // Add one default qubit line
        addQubit();
        drawControlLines();

        document.getElementById('quicDisplay').innerHTML = '';
    });
    
});
