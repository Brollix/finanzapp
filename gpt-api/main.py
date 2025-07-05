import os
import json
import requests  # Use requests to call the local API

# URL of the local GPT4All API
API_URL = "http://localhost:4891/v1/completions"

def read_ocr_output(file_path):
    """Reads the content of the OCR output file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: The file {file_path} was not found.")
        return None
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return None

def format_ticket_with_local_gpt(ocr_text):
    """Sends the OCR text to the local GPT API for formatting into JSON."""
    if not ocr_text:
        return None

    # This was the last working prompt
    prompt = f"""
    Please analyze the following text from an OCR scan of a supermarket receipt.
    Extract the key information and format it into a single JSON object.

    **VERY IMPORTANT RULE FOR NUMBERS:**
    The source text uses the Argentinian number format. The period '.' is a thousands separator and the comma ',' is the decimal separator.
    To create a valid JSON number (float), you MUST first REMOVE all periods '.' from the number string, and then REPLACE the comma ',' with a period '.'.
    For example, the text "5.850,00" must be converted to the number 5850.00 in the JSON.

    The JSON object should have the following structure:
    - \"supermarket\": The name of the supermarket (string). This is usually the first line of the text.
    - \"datetime\": The date and time of the purchase (string). Look for a line containing a date (e.g., DD/MM/YYYY) and a time (e.g., HH:MM:SS). Ignore other dates, such as "INICIO ACTIVIDAD".
    - \"total\": The final total amount of the ticket (float).
    - \"items\": A list of all purchased items. Each item in the list should be a JSON object with:
        - \"description\": The full name or description of the product (string).
        - \"quantity\": The quantity of the item (float).
        - \"price\": The total price for that item line (float).

    Here is the OCR text:
    ---
    {ocr_text}
    ---

    Return ONLY the JSON object, without any additional text or explanations.
    """

    payload = {
        "prompt": prompt,
        "temperature": 0.2,
        "max_tokens": 1500
    }

    try:
        response = requests.post("http://localhost:4891/v1/completions", json=payload)
        response.raise_for_status()
        return response.json() # The api should return a valid json
    except requests.exceptions.RequestException as e:
        print(f"Error calling the local API: {e}")
        return None
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON from API response.")
        print(f"Raw response: {response.text}")
        return None

def main():
    """Main function to read OCR text, format it, and save the JSON."""
    input_filename = '..\\ocr-apiresponse.txt'
    output_filename = 'formatted_ticket.json'

    ocr_text = ""
    try:
        with open(input_filename, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                ocr_text = data.get('text', '')
            except json.JSONDecodeError:
                f.seek(0) # Go back to the start of the file
                ocr_text = f.read()
    except FileNotFoundError:
        print(f"Error: The file {input_filename} was not found.")
        return

    if not ocr_text.strip():
        print(f"Error: The file {input_filename} is empty or contains no text.")
        return

    formatted_data = format_ticket_with_local_gpt(ocr_text)

    if formatted_data:
        # Check if the API returned an error payload
        if "error" in formatted_data:
            print("The API returned an error:")
            print(f"Error: {formatted_data.get('error')}")
            print(f"Raw output: {formatted_data.get('raw')}")
        else:
            # This is the success case. Save the JSON to a file.
            try:
                with open(output_filename, 'w', encoding='utf-8') as f:
                    json.dump(formatted_data, f, indent=4, ensure_ascii=False)
                print(f"Successfully saved formatted data to {output_filename}")
            except Exception as e:
                print(f"An error occurred while saving the file: {e}")
    else:
        # This case handles when format_ticket_with_local_gpt returns None
        print("Failed to get a response from the API.")

if __name__ == "__main__":
    main()
