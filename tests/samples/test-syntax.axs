// Test file for NetLinx syntax highlighting

/*
 * Block comments should be highlighted correctly
 */

PROGRAM_NAME='TestHighlighting'

// Include files
#INCLUDE 'SNAPI'
#INCLUDE 'UnicodeLib'
#INCLUDE 'Math'

// Define compiler directives
#IF_DEFINED ENABLE_DEBUGGING
#DEFINE DEBUG_MODE
#ELSE
#WARN 'Debugging not enabled'
#END_IF

// Device definitions
DEFINE_DEVICE
dvTP = 10001:1:0    // device:port:system
vdvTest = 33001:1:0
dvMatrix = 5001:1:0
dvProjector = 5002:2:0
dvRS232 = 5001:1:1  // Master:Port:System
dvIR = 5001:2:1
dvRelays[4] = {8001:1:0, 8001:2:0, 8001:3:0, 8001:4:0}  // Array of devices

// Constants
DEFINE_CONSTANT
INTEGER MY_CONSTANT = 42
CHAR MY_STRING[] = 'This is a test'
INTEGER BTN_POWER = 1
INTEGER BTN_SOURCE = 2
INTEGER BTN_VOLUME_UP = 3
INTEGER BTN_VOLUME_DOWN = 4
INTEGER RELAYS[] = {1, 2, 3, 4}
CHAR IP_ADDRESS[] = '192.168.1.100'
LONG SERIAL_SETTINGS = 38400 | PARITY_NONE | DATA_BITS_8 | STOP_BITS_1 | FLOW_NONE
SINTEGER NEGATIVE_VALUE = -10
CHAR COMMAND_ON[]  = 'POWER ON'
CHAR COMMAND_OFF[] = 'POWER OFF'
WIDECHAR UNICODE_TEXT[] = "'This is Unicode text'"
FLOAT PI_VALUE = 3.14159

// Variables 
DEFINE_VARIABLE
VOLATILE INTEGER nCounter
CHAR cBuffer[100]
PERSISTENT INTEGER nSystemState
NONVOLATILE CHAR cSettings[256]
INTEGER nArray[10]
LONG lValues[5]
SINTEGER snValues[5]
FLOAT fTemperatures[4]
DOUBLE dPreciseValues[3]
WIDECHAR wcUnicodeString[100]
DEV dvDeviceArray[10]
DEVCHAN dcDeviceChannels[5]
DEVTODT dtDeviceToData[5]

// User-defined data types
DEFINE_TYPE
STRUCTURE MyStructure
{
	INTEGER id
	CHAR name[50]
	FLOAT value
}

STRUCTURE RoomSettings
{
	CHAR roomName[30]
	INTEGER defaultVolume
	CHAR defaultSource[20]
	STRUCTURE {
		INTEGER red
		INTEGER green
		INTEGER blue
	} lightingPreset
}

// Variable instances of structures
DEFINE_VARIABLE
VOLATILE MyStructure myData
PERSISTENT RoomSettings roomConfigs[5]

define_function char SomeOtherFunction5(INTEGER param1, CHAR param2[])
{
	STACK_VAR CHAR result[100]
	
	IF (param1 > 5 AND param1 < 10)
	{
		result = "Parameter is between 5 and 10"
	}
	ELSE
	{
		result = "Parameter is out of range"
	}
	
	RETURN result
}

// Function without return type
DEFINE_FUNCTION TestFunction1()
{
	STACK_VAR INTEGER var
	local_var CHAR str[100]
	var = 10
	
	// Test variable highlighting
	str = 'Test string'
	
	// Test function call highlighting
	SomeOtherFunction(var, str)
}

// Function with return type
DEFINE_FUNCTION CHAR[100] TestFunction2(INTEGER param1, CHAR param2[])
{
	STACK_VAR CHAR result[100]
	
	IF (param1 > 5 AND param1 < 10)
	{
		result = "Parameter is between 5 and 10"
	}
	ELSE
	{
		result = "Parameter is out of range"
	}
	
	RETURN result
}

// Function with reference parameters
DEFINE_FUNCTION SwapValues(INTEGER a[], INTEGER b[])
{
	STACK_VAR INTEGER temp
	temp = a[1]
	a[1] = b[1]
	b[1] = temp
}

// String manipulation function
DEFINE_FUNCTION CHAR[100] FormatName(CHAR firstName[], CHAR lastName[])
{
	RETURN "$(lastName), $(firstName)"
}

// Function demonstrating various control structures
DEFINE_FUNCTION ProcessArray(INTEGER values[], INTEGER size)
{
	STACK_VAR INTEGER i, sum, max, min
	
	// For loop
	sum = 0
	FOR (i = 1; i <= size; i++)
	{
		sum = sum + values[i]
	}
	
	// While loop
	i = 1
	max = values[1]
	WHILE (i <= size)
	{
		IF (values[i] > max)
		{
			max = values[i]
		}
		i++
	}
	
	// Do-while loop
	i = 1
	min = values[1]
	DO
	{
		IF (values[i] < min)
		{
			min = values[i]
		}
		i++
	}
	WHILE (i <= size)
	
	// Switch case
	SWITCH (size)
	{
		CASE 0 :
		{
			SEND_STRING 0, 'Array is empty'
		}
		CASE 1 :
		{
			SEND_STRING 0, 'Array has one element'
		}
		DEFAULT :
		{
			SEND_STRING 0, "'Array has ', ITOA(size), ' elements'"
		}
	}
	
	// Break and continue examples
	FOR (i = 1; i <= size; i++)
	{
		IF (values[i] < 0)
		{
			CONTINUE
		}
		
		IF (values[i] > 100)
		{
			BREAK
		}
		
		// Process value
	}
}

// Event handlers
DEFINE_EVENT

// Data events
DATA_EVENT[dvTP]
{
	ONLINE:
	{
		SEND_COMMAND dvTP, "'^TXT-1,0,Starting up...'"
	}
	
	OFFLINE:
	{
		SEND_STRING 0, 'Touch panel went offline'
	}
	
	STRING:
	{
		SEND_STRING 0, "'Received string: ', DATA.TEXT"
		SWITCH (DATA.TEXT)
		{
			CASE 'INIT' :
			{
				CALL InitSystem()
			}
			CASE 'RESET' :
			{
				CALL ResetSystem()
			}
		}
	}
	
	COMMAND:
	{
		SEND_STRING 0, "'Received command: ', DATA.TEXT"
		SWITCH (DATA.TEXT[1])
		{
			CASE 'SET' :
			{
				// Process SET command
				STACK_VAR CHAR params[10][30]
				STACK_VAR INTEGER paramCount
				
				paramCount = ParseString(DATA.TEXT, ' ', params)
				
				IF (paramCount >= 3 AND params[2] == 'VOLUME')
				{
					nSystemState = ATOI(params[3])
				}
			}
		}
	}
	
	ONERROR:
	{
		SEND_STRING 0, "'Error: ', ITOA(DATA.NUMBER)"
	}
}

// Button events
BUTTON_EVENT[dvTP, 1]
{
	PUSH:
	{
		TO[vdvTest, 1]
		TestFunction1()
	}
	
	RELEASE:
	{
		OFF[vdvTest, 1]
	}
	
	HOLD[3.5]:
	{
		SEND_STRING 0, 'Button held for 3.5 seconds'
	}
	
	DOUBLE_CLICK:
	{
		SEND_STRING 0, 'Button double-clicked'
	}
}

// Button event for multiple buttons
BUTTON_EVENT[dvTP, [2,3,4]]
{
	PUSH:
	{
		SWITCH (BUTTON.INPUT.CHANNEL)
		{
			CASE 2 :
			{
				SEND_STRING 0, 'Button 2 pushed'
			}
			CASE 3 :
			{
				SEND_STRING 0, 'Button 3 pushed'
			}
			CASE 4 :
			{
				SEND_STRING 0, 'Button 4 pushed'
			}
		}
	}
}

// Button event with button array
BUTTON_EVENT[dvTP, BTN_VOLUME_UP]
{
	PUSH:
	{
		nCounter++
		SEND_COMMAND dvTP, "'^TXT-1,0,Count: ', ITOA(nCounter)"
	}
}

// Channel events
CHANNEL_EVENT[dvTP, 1]
{
	ON:
	{
		SEND_STRING 0, 'Channel 1 turned ON'
	}
	
	OFF:
	{
		SEND_STRING 0, 'Channel 1 turned OFF'
	}
}

// Level events
LEVEL_EVENT[dvTP, 1]
{
	SEND_STRING 0, "'Level 1 changed to: ', ITOA(LEVEL.VALUE)"
	
	// Set the volume on the projector
	SEND_LEVEL dvProjector, 1, LEVEL.VALUE
}

// Timeline events
DEFINE_VARIABLE
TIMELINE tlFeedback
LONG lFeedbackTime[1] = {1000}

DEFINE_EVENT
TIMELINE_EVENT[tlFeedback]
{
	SEND_STRING 0, 'Timeline event triggered'
	
	// Toggle a channel
	[dvTP, 5] = ![dvTP, 5]
}

// Wait events
WAIT 50 'STARTUP_DELAY'
{
	SEND_STRING 0, 'System starting up'
}

WAIT_UNTIL ([dvTP, 1] AND [vdvTest, 2])
{
	SEND_STRING 0, 'Conditions met'
}

// Random timing
WAIT (1000 * (RANDOM_NUMBER(5) + 1)) 'RANDOM_TIMING'
{
	SEND_STRING 0, 'Random delay completed'
}

// String and numeric operations
DEFINE_FUNCTION DemonstrateOperations()
{
	STACK_VAR CHAR str1[100], str2[100], result[200]
	STACK_VAR INTEGER i, j
	
	// String operations
	str1 = 'Hello'
	str2 = 'World'
	
	// Concatenation
	result = "str1, ' ', str2"
	result = "str1, ' ', str2, '!'"
	
	// String functions
	result = MID_STRING(str1, 2, 3)  // Extract 'ell'
	result = LEFT_STRING(str1, 2)    // Extract 'He'
	result = RIGHT_STRING(str1, 2)   // Extract 'lo'
	i = LENGTH_STRING(str1)          // Get length
	i = FIND_STRING(str1, 'e', 1)    // Find position of 'e'
	
	// Numeric operations
	i = 10 + 5        // Addition
	i = 10 - 5        // Subtraction
	i = 10 * 5        // Multiplication
	i = 10 / 5        // Division
	i = 10 % 3        // Modulus
	i = i + 1         // Increment
	i = i - 1         // Decrement
	
	// Logical operations
	IF (i > 0 AND j <= 10)
	{
		// Do something
	}
	
	IF (i == 0 OR j == 0)
	{
		// Do something
	}
	
	IF (NOT (i == j))
	{
		// Do something
	}
	
	// Bitwise operations
	i = 5 & 3         // Bitwise AND
	i = 5 | 3         // Bitwise OR
	i = 5 ^ 3         // Bitwise XOR
	i = ~5            // Bitwise NOT
	i = 5 << 1        // Left shift
	i = 5 >> 1        // Right shift
}

// Launch a DEFINE_START section which runs at system start
DEFINE_START
{
	SEND_STRING 0, 'System starting up...'
	nCounter = 0
	
	// Start timeline
	TIMELINE_CREATE(tlFeedback, lFeedbackTime, 1, TIMELINE_RELATIVE, TIMELINE_REPEAT)
	
	// Serial port configuration
	CREATE_BUFFER dvRS232, cBuffer
	SET_BAUD_RATE(dvRS232, 9600)
	SET_DATA_BITS(dvRS232, DATA_BITS_8)
	SET_STOP_BITS(dvRS232, STOP_BITS_1)
	SET_PARITY(dvRS232, PARITY_NONE)
	SET_FLOW_CONTROL(dvRS232, FLOW_NONE)
	
	// Send initialization commands
	SEND_STRING dvProjector, "$13,$10,'POWER ON',$13,$10"
	PULSE[dvRelays[1], 5]  // Pulse relay 1 for 0.5 seconds
}

// DEFINE_MODULE section for module interface
DEFINE_MODULE 'ProjectorControl' mdlProjector(vdvTest, dvProjector)

// DEFINE_CALL section for callback handlers
DEFINE_CALL 'HandlePowerStatus' (CHAR status[])
{
	SWITCH (status)
	{
		CASE 'ON' :
		{
			ON[dvTP, BTN_POWER]
		}
		CASE 'OFF' :
		{
			OFF[dvTP, BTN_POWER]
		}
		CASE 'WARMING' :
		{
			SEND_COMMAND dvTP, "'^TXT-1,0,Warming Up...'"
		}
	}
}

// DEFINE_COMBINE_EVENTS section
DEFINE_COMBINE_EVENTS
COMBINE_EVENTS [dvTP, [1,2,3,4]] 
NAME 'NavigationButtons'
{
	STACK_VAR INTEGER btn
	btn = BUTTON.INPUT.CHANNEL
	SEND_STRING 0, "'Navigation button pressed: ', ITOA(btn)"
}

// DEFINE_LATCHING section
DEFINE_LATCHING
[dvTP, 10]
[dvTP, 11]

// DEFINE_MUTUALLY_EXCLUSIVE section
DEFINE_MUTUALLY_EXCLUSIVE
[dvTP, [20,21,22,23]]

// DEFINE_PROGRAM section, which runs repeatedly
DEFINE_PROGRAM
{
	// IF-ELSE structure in program section
	IF ([dvTP, BTN_POWER])
	{
		[dvProjector, 1] = ON
	}
	ELSE
	{
		[dvProjector, 1] = OFF
	}
	
	// Channel tracking
	[vdvTest, 1] = [dvTP, BTN_POWER]
	
	// Level tracking
	SEND_LEVEL vdvTest, 1, GET_LEVEL(dvTP, 1)
}




