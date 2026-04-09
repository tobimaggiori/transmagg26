VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form Msg_OP 
   BackColor       =   &H80000007&
   Caption         =   "Imprime Orden de Pago"
   ClientHeight    =   2640
   ClientLeft      =   60
   ClientTop       =   420
   ClientWidth     =   5955
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MDIChild        =   -1  'True
   ScaleHeight     =   2640
   ScaleWidth      =   5955
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   2640
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   0
      Width           =   1695
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H80000006&
      Caption         =   "Impresoras"
      ForeColor       =   &H0080C0FF&
      Height          =   1455
      Left            =   120
      TabIndex        =   0
      Top             =   960
      Width           =   3495
      Begin VB.ListBox List1 
         Height          =   1035
         Left            =   240
         TabIndex        =   1
         Top             =   240
         Width           =   3015
      End
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   0
      Left            =   4080
      TabIndex        =   3
      Top             =   1680
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Imprimir Cheques"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "Msg_OP.frx":0000
      PICN            =   "Msg_OP.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   1
      Left            =   4080
      TabIndex        =   4
      Top             =   960
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Imprimir Orden de Pago"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "Msg_OP.frx":0A2E
      PICN            =   "Msg_OP.frx":0A4A
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Etiqueta 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Comprobante Grabado Correctamente"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   4
      Left            =   0
      TabIndex        =   7
      Top             =   240
      Width           =   4215
   End
   Begin VB.Label NroOP 
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label1"
      Height          =   255
      Left            =   2400
      TabIndex        =   6
      Top             =   600
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Nro Orden de Pago"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   1
      Left            =   480
      TabIndex        =   5
      Top             =   600
      Width           =   3855
   End
End
Attribute VB_Name = "Msg_OP"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Form_Load()

     Obtener_Impresoras
     List1.ListIndex = 0
 End Sub

 Public Function Obtener_Impresoras()
     Dim i As Integer
     ' recorre las impresoras del sistema y las añade a la lista
     For i = 0 To Printers.Count - 1
         List1.AddItem Printers(i).DeviceName
     Next

 End Function

Public Function Establecer(Nombre_Impresora As String)
Dim Prt As Printer
     ' Establece la impresora que se utilizará para imprimir
For Each Prt In Printers
    If Prt.DeviceName = Nombre_Impresora Then
        Set Printer = Prt
    End If
Next
End Function
Private Sub Opcion_Click(Index As Integer)
If List1.ListIndex <> -1 Then
        Call Establecer(List1.Text)
        MsgBox "Se usará la impresora: " & _
                Printer.DeviceName & " para imprimir el texto", vbInformation
End If
If Index = 1 Then
    Call ImprimeOP(NroOP)
ElseIf Index = 0 Then
    Call ImprimeCHOP(NroOP, Text1)
End If

End Sub
