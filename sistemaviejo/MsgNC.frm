VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form MsgNC 
   BackColor       =   &H80000007&
   Caption         =   "Mensage"
   ClientHeight    =   1560
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   1560
   ScaleWidth      =   4680
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   3000
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   360
      Width           =   1335
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   375
      Left            =   1200
      TabIndex        =   2
      Top             =   960
      Width           =   2175
      _ExtentX        =   3836
      _ExtentY        =   661
      BTYPE           =   1
      TX              =   "Aplicar"
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
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "MsgNC.frx":0000
      PICN            =   "MsgNC.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Ingrese el Nro Facta aplicar"
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
      Index           =   0
      Left            =   120
      TabIndex        =   0
      Top             =   360
      Width           =   2655
   End
End
Attribute VB_Name = "MsgNC"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Aceptar_Click()
If Not Text1 = "" Then
    Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where NroFact = " & Text1 & "")
    Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & Text1 & "")
    If Not rsEncabFact!Codigo = 99999 Then
    With FacturarViajes
        .Viaje(10) = Text1
        .Text1(0) = rsEncabFact!Codigo
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!Codigo & "")
        .Text1(1) = rsEmpresas!DescEmpresas
        Set rsEmpresas = Nothing
        Set rsEncabFact = Nothing
        .ListaViajes.ListItems.Clear
        Do While Not rsDetFact.EOF
            Set Lista = .ListaViajes.ListItems.Add(, , rsDetFact!FechaViaje)
            Lista.Tag = rsDetFact!FechaViaje
            Lista.SubItems(1) = rsDetFact!NroRem
            Lista.SubItems(2) = rsDetFact!Chofer
            Lista.SubItems(3) = rsDetFact!Mercaderia
            Lista.SubItems(4) = rsDetFact!Procedencia
            Lista.SubItems(5) = rsDetFact!Destino
            Lista.SubItems(6) = rsDetFact!Kilos
            Lista.SubItems(7) = rsDetFact!Tarifa
            Lista.SubItems(8) = rsDetFact.Fields("STotal")
            rsDetFact.MoveNext
        Loop
    End With
    Set rsDetFact = Nothing
    
    Unload Me
    Else
        MsgBox "Factura Eliminada", vbInformation
    End If
End If
End Sub

Private Sub Form_Load()
Text1 = ""

End Sub
