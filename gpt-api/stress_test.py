import time
from main import format_ticket_with_local_gpt, read_ocr_output

def stress_test(n=20, input_file='ocr-apiresponse.txt'):
    tiempos = []
    ocr_text = read_ocr_output(input_file)
    for i in range(n):
        print(f"\nPrueba {i+1}/{n}:")
        start = time.time()
        result = format_ticket_with_local_gpt(ocr_text)
        end = time.time()
        dur = end - start
        tiempos.append(dur)
        if result is not None:
            print(f"✅ Respuesta recibida en {dur:.2f} segundos")
        else:
            print(f"❌ Error en la respuesta ({dur:.2f} segundos)")
    print("\n--- Resultados ---")
    for i, t in enumerate(tiempos):
        print(f"Prueba {i+1}: {t:.2f} segundos")
    print(f"\nPromedio: {sum(tiempos)/len(tiempos):.2f} segundos")

if __name__ == "__main__":
    stress_test()
